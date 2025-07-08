require("dotenv").config({ path: "../../../.env" })
const { Client, GatewayIntentBits, Partials } = require("discord.js")

const { createClient } = require("@supabase/supabase-js")

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Channel],
})

client.once("ready", async () => {
    console.log(`✅ Logged in as bot user: ${client.user.tag}`)
    await runGovernor()

    // // Wait 5 seconds
    // await new Promise((resolve) => setTimeout(resolve, 5000))
    // await runGovernor()

    // // Wait 10 seconds
    // await new Promise((resolve) => setTimeout(resolve, 10000))
    // await runGovernor()
})

// *************************************************************
// Constants
// *************************************************************
const MAX_QUEUE_LENGTH = 10
const TIMEOUT_SECONDS = 60
const MAX_ATTEMPTS = 3

const MAX_MESSAGES_TO_PROCESS = 2

async function runGovernor() {
    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
        let invokedCounter = 0

        // *************************************************************
        // STEP 1
        // Check the queue for any items that have passed their timeout
        // If so, increment their attempts, set their state to "error"
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

        // *************************************************************
        // STEP 2
        // Look at the DB again to get the new total number of running
        // items and available space
        // *************************************************************

        const availableSpace = MAX_QUEUE_LENGTH - (queueItems?.length || 0)

        if (availableSpace <= 0) {
            console.log("No available space in the queue. Exiting.")
            return
        } else {
            console.log(`Available space in queue: ${availableSpace}`)
        }

        // *************************************************************
        // STEP 3
        // Get all projects that have discord enabled and have a url in
        // their project_signal_strengths url field
        // *************************************************************

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

        // *************************************************************
        // STEP 4
        // Process each project
        // *************************************************************
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

            // *************************************************************
            // STEP 5
            // For each channel, check queue and trigger if needed
            // *************************************************************
            for (const [channelId, channel] of channels) {
                // Look in the queue for any current items for this channel that are not completed
                const { data: currentQueueItem, error: currentQueueItemError } = await supabase
                    .from("discord_request_queue")
                    .select("*")
                    .eq("guild_id", guildId)
                    .eq("channel_id", channelId)
                    .neq("status", "completed")
                    .limit(1)

                if (currentQueueItemError) {
                    // TODO: Handle this better
                    console.error("Error fetching current queue item:", currentQueueItemError)
                    continue
                }

                console.log("--------------------------------")
                if (currentQueueItem?.length > 0) {
                    console.log("Processing queue item ID: ", currentQueueItem[0].id)
                }

                // *************************************************************
                // STEP 6
                // If the currentQueueItem is running, skip it
                // This avoids the race conditions where two are triggered at
                // the same time
                // *************************************************************
                if (currentQueueItem?.length > 0 && currentQueueItem[0]?.status === "running") {
                    console.log(
                        `Skipping channel: ${channel.name} (ID: ${channelId}) as it is already running in queue`,
                    )
                    continue
                }

                // *************************************************************
                // STEP 7
                // If the currentQueueItem status is "error", either try to
                // trigger it again or skip it if the number of attempts is 3
                // or more
                // *************************************************************
                if (currentQueueItem?.length > 0 && currentQueueItem[0]?.status === "error") {
                    // If the number of attempts is less than MAX_ATTEMPTS,
                    // set it back to pending and try to trigger it again
                    if (currentQueueItem[0]?.attempts < MAX_ATTEMPTS) {
                        console.log(
                            `Setting latest queue item (${currentQueueItem[0].id}) back to pending and trying again. Guild: ${guild.name}. Channel: ${channel.name}.`,
                        )
                        const { data: updatedQueueItem, error: updatedQueueItemError } = await supabase
                            .from("discord_request_queue")
                            .update({ status: "pending" })
                            .eq("id", currentQueueItem[0].id)
                            .select()

                        if (updatedQueueItemError) {
                            console.error("Error updating queue item:", updatedQueueItemError)
                        }

                        if (updatedQueueItem && updatedQueueItem.length > 0) {
                            triggerQueueItem(currentQueueItem[0].id)
                            invokedCounter++
                        }
                        continue
                    } else {
                        // If the number of attempts is MAX_ATTEMPTS or more, skip it
                        console.error(`ERROR LIMIT REACHED for queue item ${currentQueueItem[0].id}. Skipping.`)
                        continue
                    }
                }

                // *************************************************************
                // STEP 8
                // If the currentQueueItem status is "pending", try to trigger
                // it again now there is space in the queue
                // *************************************************************
                if (currentQueueItem?.length > 0 && currentQueueItem[0]?.status === "pending") {
                    console.log(
                        `Triggering pending queue item. Guild: ${guild.name}. Channel: ${channel.name}. Queue item ID: ${currentQueueItem[0].id}`,
                    )
                    triggerQueueItem(currentQueueItem[0].id)
                    invokedCounter++
                    continue
                }

                // *************************************************************
                // STEP 9
                // If there is no currentQueueItem, then we might need to add
                // one if there is a gap in the data or historical data missing
                // *************************************************************

                // Calculate the time period for the current sync
                const now = new Date()
                const previousDays = project.previous_days
                let newestTimestamp = now
                let newestMessageId = null

                // Calculate the oldest timestamp based on previousDays
                const oldestTimestampLimit = new Date(now)
                oldestTimestampLimit.setDate(oldestTimestampLimit.getDate() - previousDays)

                // Check existing queue items to find the newest gap
                const { data: existingQueueItems, error: existingQueueError } = await supabase
                    .from("discord_request_queue")
                    .select("id, oldest_message_timestamp, oldest_message_id, newest_message_timestamp")
                    .eq("guild_id", guildId)
                    .eq("channel_id", channelId)
                    .order("newest_message_timestamp", { ascending: false })

                if (existingQueueError) {
                    console.error("Error fetching existing queue items:", existingQueueError)
                    continue
                }

                // Determine the starting point for the sync and check for gaps
                if (existingQueueItems.length > 0) {
                    let gapFound = false

                    // Check for gaps between the items in the queue
                    // A gap is when there are two consecutive items where the newest_message_timestamp
                    // of the next item is less than the oldest_message_timestamp of the current item
                    for (let i = 0; i < existingQueueItems.length - 1; i++) {
                        const currentItem = existingQueueItems[i]
                        const nextItem = existingQueueItems[i + 1]

                        // Check for a gap between current and next item
                        if (nextItem.newest_message_timestamp < currentItem.oldest_message_timestamp) {
                            // Found a gap, set the newestTimestamp and newestMessageId to the end of the gap
                            console.log("Found a gap between current and next item")
                            console.log("currentItem.id", currentItem.id)
                            console.log("nextItem.id", nextItem.id)
                            newestTimestamp = new Date(currentItem.oldest_message_timestamp)
                            newestMessageId = currentItem.oldest_message_id
                            gapFound = true
                            break
                        }
                    }

                    // If no gap was found, find the item with the absolute oldest_message_timestamp
                    if (!gapFound) {
                        let oldestTimestamp = new Date(existingQueueItems[0].oldest_message_timestamp)
                        let oldestMessageId = existingQueueItems[0].oldest_message_id

                        for (const item of existingQueueItems) {
                            const itemTimestamp = new Date(item.oldest_message_timestamp)
                            if (itemTimestamp < oldestTimestamp) {
                                oldestTimestamp = itemTimestamp
                                oldestMessageId = item.oldest_message_id
                            }
                        }

                        newestTimestamp = oldestTimestamp
                        newestMessageId = oldestMessageId
                    }
                }

                // Ensure the sync does not go beyond the oldestTimestampLimit
                if (newestTimestamp < oldestTimestampLimit) {
                    // When there are no more messages to sync for a channel, the newestTimestamp will be
                    // null, which is 1970-01-01T00:00:00.000Z so will be less than the oldestTimestampLimit
                    // so this is correct response.
                    console.log(
                        `The data already covers the range up to ${previousDays} days ago. No further sync needed. Guild: ${guild.name}. Channel: ${channel.name}.`,
                    )
                    continue
                }

                // Add an item to the queue then trigger that item
                const { data: queueItem, error: queueItemError } = await supabase
                    .from("discord_request_queue")
                    .insert({
                        guild_id: guildId,
                        channel_id: channelId,
                        status: "pending",
                        newest_message_timestamp: newestTimestamp,
                        newest_message_id: newestMessageId,
                        // oldest_message_timestamp and oldest_message_id will be set by triggerQueueItem
                    })
                    .select()

                if (queueItemError) {
                    console.error("Error adding queue item:", queueItemError)
                    continue
                }

                // Get the id of the new queue item
                const queueItemId = queueItem[0].id

                console.log(`Triggering new queue item: ${queueItemId}`)
                triggerQueueItem(queueItemId)
                invokedCounter++

                // Calculate the new queue length
                if (availableSpace <= invokedCounter >= MAX_QUEUE_LENGTH) {
                    console.log("Queue is full. Exiting.")
                    return
                }
            }
        }
    } catch (error) {
        console.error("Error in runGovernor:", error)
    }
}

// TODO: This will be a separate lambda function that will
// be called by the governor to trigger a queue item
async function triggerQueueItem(queueItemId) {
    // Check running queue items to check there is space to attempt to claim
    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

        const { data: queueItems, error: queueError } = await supabase
            .from("discord_request_queue")
            .select("*")
            .eq("status", "running")

        if (queueError) {
            console.error("Error fetching queue items:", queueError)
            return
        }

        const runningQueueItems = queueItems?.length || 0

        if (runningQueueItems >= MAX_QUEUE_LENGTH) {
            console.log("Queue is full. Exiting.")
            return
        }

        // Try to claim the queue item
        const { data: claimedQueueItem, error: claimedQueueItemError } = await supabase
            .from("discord_request_queue")
            .update({ status: "running" })
            .eq("id", queueItemId)
            .eq("status", "pending")
            .select()

        if (claimedQueueItemError) {
            console.error("Error claiming queue item:", claimedQueueItemError)
            return
        }

        if (claimedQueueItem && claimedQueueItem.length > 0) {
            console.log(`Claimed queue item: ${queueItemId}`)

            // Set the started_at timestamp to the current time
            const { error: updatedQueueItemStartedAtError } = await supabase
                .from("discord_request_queue")
                .update({ started_at: new Date().toISOString() })
                .eq("id", queueItemId)
                .select()

            if (updatedQueueItemStartedAtError) {
                console.error("Error updating queue item started_at:", updatedQueueItemStartedAtError)
            }

            const guild = await client.guilds.fetch(claimedQueueItem[0].guild_id)
            const channel = await guild.channels.fetch(claimedQueueItem[0].channel_id)

            console.log(`Processing channel: ${channel.name} (ID: ${claimedQueueItem[0].channel_id})`)

            // TODO: Add "pagination" so that it processes more than one batch of messages before
            // updating the queue item to "completed" and setting the oldest_message_id to the
            // oldest message it processed and stored in the DB

            // Fetch messages from the channel
            const messages = await channel.messages.fetch({
                limit: MAX_MESSAGES_TO_PROCESS,
                before: claimedQueueItem[0].newest_message_id,
            })

            messages.forEach(async (msg) => {
                // If the message is shorter than 10 characters, skip it
                if (msg.content.length < 10) {
                    console.log("Skipping message:", msg.id, "as it is shorter than 10 characters")
                    return
                }

                // TODO: Sanitize the message content before storing it in the DB

                // Store the message in the DB
                const { data: storedMessage, error: storedMessageError } = await supabase
                    .from("discord_messages")
                    .insert({
                        message_id: msg.id,
                        guild_id: guild.id,
                        channel_id: channel.id,
                        discord_user_id: msg.author.id,
                        content: msg.content,
                        created_timestamp: new Date(msg.createdTimestamp).toISOString(),
                    })
                    .select()

                if (storedMessageError) {
                    if (storedMessageError.message.includes("duplicate key")) {
                        console.log("Message already stored in DB:", msg.id)
                    } else {
                        console.error("Error storing message:", storedMessageError)
                    }
                }

                if (storedMessage) {
                    console.log(`Stored message: ${msg.id}`)
                }
            })

            // Once enough messages have been processed, update the queue item to "completed"
            const lastMessage = messages.last()
            const oldestMessageId = lastMessage?.id
            const oldestMessageTimestamp = lastMessage?.createdTimestamp

            const { data: updatedQueueItem, error: updatedQueueItemError } = await supabase
                .from("discord_request_queue")
                .update({
                    status: "completed",
                    ...(oldestMessageId && { oldest_message_id: oldestMessageId }),
                    ...(oldestMessageTimestamp && {
                        oldest_message_timestamp: new Date(oldestMessageTimestamp).toISOString(),
                    }),
                    finished_at: new Date().toISOString(),
                })
                .eq("id", queueItemId)
                .select()

            if (updatedQueueItemError) {
                console.error("Error updating queue item:", updatedQueueItemError)
            }

            if (updatedQueueItem) {
                console.log(`Updated queue item: ${queueItemId}`)
            }
            return
        } else {
            console.log(`Failed to claim queue item: ${queueItemId}`)
            return
        }
    } catch (error) {
        console.error("Error in triggerQueueItem:", error)
    }

    console.log(`Triggering queue item: ${queueItemId}`)
}

// Start the client
client.login(process.env.DISCORD_BOT_TOKEN)
