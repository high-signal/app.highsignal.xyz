require("dotenv").config({ path: "../../../.env" })
const { Client, GatewayIntentBits, Partials } = require("discord.js")

const { createClient } = require("@supabase/supabase-js")

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // connect to guilds
        GatewayIntentBits.GuildMessages, // read messages
        GatewayIntentBits.MessageContent, // read message content
    ],
    partials: [Partials.Channel],
})

client.once("ready", () => {
    console.log(`✅ Logged in as bot user: ${client.user.tag}`)
    runGovernor()
})

async function runGovernor() {
    const MAX_QUEUE_LENGTH = 10
    const TIMEOUT_SECONDS = 60

    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

        // *************************************************************
        // STEP 1
        // Check the queue for any items that have passed their timeout
        // *************************************************************

        // Get all items in the queue that are running
        const { data: queueItems, error: queueError } = await supabase
            .from("discord_request_queue")
            .select("*")
            .eq("status", "running")

        if (queueError) {
            console.error("Error fetching queue items:", queueError)
            return
        }

        // Check if any of these have passed their timeout
        // If so, increment their attempts, set their state to "error"
        if (queueItems?.length > 0) {
            for (const queueItem of queueItems) {
                // Convert started_at string to timestamp for comparison
                const startedAtTimestamp = new Date(queueItem.started_at).getTime()

                // If a queue item has been running for more than 60 seconds,
                // increment the attempts and set the status to "error"
                if (startedAtTimestamp < Date.now() - 1000 * TIMEOUT_SECONDS) {
                    console.log(
                        `Queue item ${queueItem.id} has been running for more than ${TIMEOUT_SECONDS} seconds. Incrementing attempts and setting status to "error".`,
                    )
                    await supabase
                        .from("discord_request_queue")
                        .update({ attempts: queueItem.attempts + 1, status: "error" })
                        .eq("id", queueItem.id)
                }
            }
        }

        // Look at the DB again to get the new total number of running items and available space
        const availableSpace = MAX_QUEUE_LENGTH - (queueItems?.length || 0)

        console.log(`Available space: ${availableSpace}`)

        if (availableSpace <= 0) {
            console.log("No available space in the queue. Exiting.")
            return
        }

        // Get the discord signal strength id
        const { data: discordSignalStrength, error: discordError } = await supabase
            .from("signal_strengths")
            .select("id")
            .eq("name", "discord")
            .single()

        if (discordError || !discordSignalStrength) {
            console.error("Error fetching discord signal strength:", discordError)
            return
        }

        // Get all projects that have discord enabled and have a url in their project_signal_strengths url field
        const { data: projects, error: projectsError } = await supabase
            .from("project_signal_strengths")
            .select(
                `
                *,
                projects (
                    id,
                    display_name,
                    url_slug
                )
            `,
            )
            .eq("enabled", true)
            .eq("signal_strength_id", discordSignalStrength.id)
            .not("url", "is", null)

        if (projectsError) {
            console.error("Error fetching projects:", projectsError)
            return
        }

        console.log(`Found ${projects.length} projects with discord enabled and URLs`)

        // Process each project
        for (const project of projects) {
            console.log(
                `Processing project: ${project.projects.display_name} (${project.projects.url_slug}) with Discord URL: ${project.url}`,
            )

            // Extract guild ID from the Discord URL
            const urlMatch = project.url.match(/discord\.com\/channels\/(\d+)/)
            if (!urlMatch) {
                console.log(`Skipping project ${project.project_id}: Invalid Discord URL format`)
                continue
            }
            const guildId = urlMatch[1]

            const guild = await client.guilds.fetch(guildId)
            await guild.channels.fetch() // Fetch all channels in the guild

            // Filter out non-text channels
            const channels = guild.channels.cache.filter((channel) => channel.type === 0) // 0 = TextChannel

            console.log(`Found ${channels.size} text channels in guild: ${guild.name}`)
            // For each channel, check queue and trigger if needed
            for (const [channelId, channel] of channels) {
                // Look in the queue for any current items for this channel that are not completed
                const { data: currentQueueItem, error: currentQueueItemError } = await supabase
                    .from("discord_request_queue")
                    .select("*")
                    .eq("guild_id", guildId)
                    .eq("channel_id", channelId)
                    .not("status", "is", "completed")
                    .limit(1)

                if (currentQueueItemError) {
                    // TODO: Handle this better
                    console.error("Error fetching current queue item:", currentQueueItemError)
                    continue
                }

                // If the currentQueueItem is currently running, skip it
                if (currentQueueItem?.length > 0 && currentQueueItem[0]?.status === "running") {
                    console.log(`Skipping channel: ${channel.name} (ID: ${channelId}) because it is currently running`)
                    continue
                }

                // If the currentQueueItem status is "error",
                if (currentQueueItem?.length > 0 && currentQueueItem[0]?.status === "error") {
                    // If the number of attempts is less than 3,
                    // set it back to pending and try to trigger it again
                    if (latestQueueItem[0]?.attempts < 3) {
                        console.log(
                            `Setting latest queue item (${latestQueueItem[0].id}) back to pending and trying again. Guild: ${guild.name}. Channel: ${channel.name}.`,
                        )
                        await supabase
                            .from("discord_request_queue")
                            .update({ status: "pending" })
                            .eq("id", latestQueueItem[0].id)

                        // triggerQueueItem(queueItemId)
                        continue
                    } else {
                        // If the number of attempts is 3 or more, skip it
                        console.error(`ERROR LIMIT REACHED for queue item ${latestQueueItem[0].id}. Skipping.`)
                        continue
                    }
                }

                // If the currentQueueItem status is "pending", try to trigger it again now there is space in the queue
                if (currentQueueItem?.length > 0 && currentQueueItem[0]?.status === "pending") {
                    console.log(`Triggering current queue item. Guild: ${guild.name}. Channel: ${channel.name}.`)
                    // triggerQueueItem(queueItemId)
                    continue
                }

                // If there is no currentQueueItem, then we need to add one
                console.log(`Processing channel: ${channel.name} (ID: ${channelId})`)

                // TODO: Here is where you need to calculate the time periods to see what messages to fetch

                // Add an item to the queue then trigger that item
                const { data: queueItem, error: queueItemError } = await supabase
                    .from("discord_request_queue")
                    .insert({
                        guild_id: guildId,
                        channel_id: channelId,
                        status: "pending",
                        // TODO: ADD the start_message_id and start_message_timestamp here
                    })
                    .select()

                if (queueItemError) {
                    console.error("Error adding queue item:", queueItemError)
                    continue
                }

                const queueItemId = queueItem[0].id

                // When run locally, this is a function call
                // When run in lambda, this is a lambda function call to another lambda
                console.log(`Triggering queue item: ${queueItemId}`)
                // triggerQueueItem(queueItemId)

                // If that item can atomically claim itself, then it will process, otherwise it will exit
                // This avoids race conditions where two are triggered at the same time

                // Wait fo lambda to respond saying it successfully claimed the item or not
                // so that we can safely check the queue length again

                // Check the queue again to see if there is space
                // If there is, continue, if not, exit
                const { data: updatedQueueItems, error: updatedQueueError } = await supabase
                    .from("discord_request_queue")
                    .select("*")
                    .eq("status", "running")

                if (updatedQueueError) {
                    console.error("Error fetching queue items:", updatedQueueError)
                    return
                }

                const updatedQueueItemsLength = updatedQueueItems?.length || 0

                if (updatedQueueItemsLength > MAX_QUEUE_LENGTH) {
                    console.log("Queue is full. Exiting.")
                    return
                }
            }
        }
    } catch (error) {
        console.error("Error in runGovernor:", error)
    }
}

// Start the client
client.login(process.env.DISCORD_BOT_TOKEN)
