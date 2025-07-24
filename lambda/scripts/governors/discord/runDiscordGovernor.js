// How to run this locally:
// node -e "require('./runDiscordGovernor.js').runDiscordGovernor().catch(console.error)"

require("dotenv").config({ path: "../../../../.env" })
const { Client, GatewayIntentBits, Partials } = require("discord.js")
const { createClient } = require("@supabase/supabase-js")
const outOfCharacter = require("out-of-character")

// ======================
// GLOBAL DISCORD LIMITS
// ======================
// 50 requests per second per bot token globally
// ~5 requests per second per bot per channel
// 100 messages max returned per request

// ==========
// Constants
// ==========
const MAX_REQUESTS_PER_SECOND_PER_CHANNEL = 5
const MAX_QUEUE_LENGTH = 20
const TIMEOUT_SECONDS = 60
const MAX_ATTEMPTS = 3
const MAX_MESSAGES_TO_PROCESS = 100
const MAX_PAGINATION_LOOPS = 10
const HEAD_GAP_MINUTES = 60
const MIN_MESSAGE_CHAR_LENGTH = 10

// Set the Discord client globally so it can be used in the triggerQueueItem function.
let client

// =================
// Run the governor
// =================
async function runDiscordGovernor() {
    console.log("💡 Running Discord governor")
    // ==========================
    // Create the Discord client
    // ==========================
    client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
        partials: [Partials.Channel],
    })

    // Wait for the client to be ready before proceeding
    await new Promise((resolve, reject) => {
        // Set up error handling for login failures
        client.once("error", (error) => {
            console.error("Discord client error:", error)
            reject(error)
        })

        // Set up the ready event handler
        client.once("ready", async () => {
            console.log(`🤖 Logged in as bot user: ${client.user.tag}`)
            resolve()
        })

        // Start the client login
        client.login(process.env.DISCORD_BOT_TOKEN).catch(reject)
    })

    // ===============================================
    // Now that the client is ready, run the governor
    // ===============================================
    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

        // Invoked counter to optimistically track
        // the number of items that have been invoked.
        let invokedCounter = 0

        // ============================
        // Check queue for stale items
        // ============================
        // Check the queue for any items that have passed their timeout.
        // If so, increment their attempts, set their state to "error".

        // Get all items in the queue that are running.
        const { data: queueItems, error: queueError } = await supabase
            .from("discord_request_queue")
            .select("*")
            .eq("status", "running")

        if (queueError) {
            console.error("Error fetching queue items:", queueError)
            return
        }

        // Check if any of these have passed their timeout.
        // If so, increment their attempts, set their state to "error".
        if (queueItems?.length > 0) {
            for (const queueItem of queueItems) {
                // Convert started_at string to timestamp for comparison.
                const startedAtTimestamp = new Date(queueItem.started_at).getTime()

                // If a queue item has been running for more than 60 seconds,
                // increment the attempts and set the status to "error".
                if (startedAtTimestamp < Date.now() - 1000 * TIMEOUT_SECONDS) {
                    console.log(
                        `⚠️ Queue item ${queueItem.id} has been running for more than ${TIMEOUT_SECONDS} seconds. Incrementing attempts and setting status to "error".`,
                    )
                    await supabase
                        .from("discord_request_queue")
                        .update({ attempts: queueItem.attempts + 1, status: "error" })
                        .eq("id", queueItem.id)
                }
            }
        }

        // ===================================
        // Check available space in the queue
        // ===================================
        // Look at the DB again to get the new total
        // number of running items and available space.

        // Calculate the available space in the queue.
        const availableSpace = MAX_QUEUE_LENGTH - (queueItems?.length || 0)

        if (availableSpace <= 0) {
            console.log("🚧 No available space in the queue. Exiting.")
            return
        } else {
            console.log(`📋 Available space in queue: ${availableSpace}`)
        }

        // ==========================
        // Find all enabled projects
        // ==========================
        // Get all projects that have discord enabled and have a url in
        // their project_signal_strengths url field.

        // Get the discord signal strength id.
        const { data: discordSignalStrength, error: discordError } = await supabase
            .from("signal_strengths")
            .select("id")
            .eq("name", "discord")
            .single()

        if (discordError || !discordSignalStrength) {
            console.error("Error fetching discord signal strength:", discordError)
            return
        }

        // Get all projects that have discord enabled and have a
        // url in their project_signal_strengths url field.
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

        console.log(`🔍 Found ${projects.length} projects with discord enabled and URLs`)

        // Shuffle projects to avoid always processing the same ones first.
        // Useful in case of ratel-imit issues that only allow the first X projects to be processed.
        const shuffledProjects = [...projects].sort(() => Math.random() - 0.5)

        // =====================
        // Process each project
        // =====================
        for (const project of shuffledProjects) {
            console.log("")
            console.log("================================")
            console.log(
                `⏳ Processing project: ${project.projects.display_name} (${project.projects.url_slug}) with Discord URL: ${project.url}`,
            )

            // Extract guild ID from the Discord URL.
            const urlMatch = project.url.match(/discord\.com\/channels\/(\d+)/)
            if (!urlMatch) {
                console.log(`⏭️ Skipping project ${project.project_id}: Invalid Discord URL format`)
                continue
            }
            const guildId = urlMatch[1]
            const guild = await client.guilds.fetch(guildId)

            // Fetch all channels in the guild.
            // This does not seem to have a documented limit, so it should be
            // able to get all channels in the guild even if there are a lot.
            // This ensures we have all channels loaded in the cache before filtering.
            const fetchedChannels = await guild.channels.fetch()

            // Filter out channels the bot does not have access to.
            const accessibleChannels = fetchedChannels.filter((channel) =>
                channel.permissionsFor(guild.members.me)?.has("ViewChannel"),
            )

            // Filter out non-text channels.
            // 0 = TextChannel
            const channels = accessibleChannels.filter((channel) => channel.type === 0)

            console.log(`🔍 Found ${channels.size} text channels in guild: ${guild.name}`)

            // Shuffle channels to avoid always processing the same ones first.
            // Useful in case of ratel-imit issues that only allow the first X channels to be processed.
            const shuffledChannels = [...channels].sort(() => Math.random() - 0.5)

            // ====================================================
            // For each channel, check queue and trigger if needed
            // ====================================================
            for (const [channelId, channel] of shuffledChannels) {
                console.log("--------------------------------")
                console.log(`⭐️ Processing Guild: ${guild.name}. Channel: ${channel.name}.`)

                // Look in the queue for any current items for this channel that are not completed.
                const { data: currentQueueItem, error: currentQueueItemError } = await supabase
                    .from("discord_request_queue")
                    .select("*")
                    .eq("guild_id", guildId)
                    .eq("channel_id", channelId)
                    .neq("status", "completed")
                    .limit(1)

                if (currentQueueItemError) {
                    console.error("Error fetching current queue item:", currentQueueItemError)
                    throw currentQueueItemError
                }

                if (currentQueueItem?.length > 0) {
                    console.log("⏳ Processing queue item ID: ", currentQueueItem[0].id)
                }

                // ============================================
                // If the currentQueueItem is running, skip it
                // ============================================
                // This avoids the race conditions where two are triggered at the same time.
                if (currentQueueItem?.length > 0 && currentQueueItem[0]?.status === "running") {
                    console.log(
                        `⏭️ Skipping channel: ${channel.name} (ID: ${channelId}) as it is already running in queue`,
                    )
                    continue
                }

                // ==========================================
                // If the currentQueueItem status is "error"
                // ==========================================
                // Either try to trigger it again or skip it if the
                // number of attempts is MAX_ATTEMPTS or more.
                if (currentQueueItem?.length > 0 && currentQueueItem[0]?.status === "error") {
                    // If the number of attempts is less than MAX_ATTEMPTS,
                    // set it back to pending and try to trigger it again.
                    if (currentQueueItem[0]?.attempts < MAX_ATTEMPTS) {
                        console.log(
                            `🔁 Setting latest queue item (${currentQueueItem[0].id}) back to pending and trying again. Guild: ${guild.name}. Channel: ${channel.name}.`,
                        )
                        const { data: updatedQueueItem, error: updatedQueueItemError } = await supabase
                            .from("discord_request_queue")
                            .update({ status: "pending" })
                            .eq("id", currentQueueItem[0].id)
                            .select()

                        if (updatedQueueItemError) {
                            console.error("Error updating queue item:", updatedQueueItemError)
                            throw updatedQueueItemError
                        }

                        // If the queue item was updated successfully to pending, try to trigger it again.
                        if (updatedQueueItem && updatedQueueItem.length > 0) {
                            await triggerQueueItem(currentQueueItem[0].id)
                            invokedCounter++
                        }
                        continue
                    } else {
                        // If the number of attempts is MAX_ATTEMPTS or more, skip it.
                        console.error(`ERROR LIMIT REACHED for queue item ${currentQueueItem[0].id}. Skipping.`)
                        continue
                    }
                }

                // ============================================
                // If the currentQueueItem status is "pending"
                // ============================================
                // Try to trigger it again now there is space in the queue.
                if (currentQueueItem?.length > 0 && currentQueueItem[0]?.status === "pending") {
                    console.log(
                        `🏁 Triggering pending queue item. Guild: ${guild.name}. Channel: ${channel.name}. Queue item ID: ${currentQueueItem[0].id}`,
                    )
                    await triggerQueueItem(currentQueueItem[0].id)
                    invokedCounter++
                    continue
                }

                // ================================
                // If there is no currentQueueItem
                // ================================
                // Then we might need to add one if there is a gap in the data.

                // Calculate the time period for the current sync.
                const now = new Date()
                const previousDays = project.previous_days
                let newestTimestamp = now
                let newestMessageId = null

                // Calculate the oldest timestamp limit based on previousDays.
                const oldestTimestampLimit = new Date(now)
                oldestTimestampLimit.setDate(oldestTimestampLimit.getDate() - previousDays)

                // Fetch any existing queue items.
                const { data: existingQueueItems, error: existingQueueError } = await supabase
                    .from("discord_request_queue")
                    .select("id, oldest_message_timestamp, oldest_message_id, newest_message_timestamp")
                    .eq("guild_id", guildId)
                    .eq("channel_id", channelId)
                    .gte("newest_message_timestamp", oldestTimestampLimit.toISOString())
                    .order("newest_message_timestamp", { ascending: false })

                if (existingQueueError) {
                    console.error("Error fetching existing queue items:", existingQueueError)
                    throw existingQueueError
                }

                // ==========================================
                // Determine the starting point for the sync
                // ==========================================

                // If there are no existing queue items, then the sync is a new head sync.
                if (existingQueueItems.length === 0) {
                    // The `newestTimestamp` is already set to the current time.
                    // The newestMessageId will initially be null, but will be set when the first message is processed.
                }

                // Look for a head gap.
                // A head gap is when it has been longer than HEAD_GAP_MINUTES since the newest_message_timestamp.
                let headGapFound = false
                if (existingQueueItems.length > 0) {
                    // Check if there is a gap between the newest_message_timestamp and the current time.
                    const newestMessageTimestamp = new Date(existingQueueItems[0].newest_message_timestamp)
                    const timeSinceNewestMessage = now.getTime() - newestMessageTimestamp.getTime()
                    if (timeSinceNewestMessage > HEAD_GAP_MINUTES * 60 * 1000) {
                        console.log(`📣 Head gap found. Processing newest messages.`)
                        headGapFound = true
                    }
                }

                if (headGapFound) {
                    // Do nothing here as it will be processed like a new head sync
                    // since the newest_message_id will be null.
                }

                // If there is no head gap, check for gaps between the items in the queue.
                // A gap is when there are two consecutive items where the newest_message_timestamp
                // of the next item is less than the oldest_message_timestamp of the current item.
                if (!headGapFound && existingQueueItems.length > 0) {
                    let gapFound = false

                    for (let i = 0; i < existingQueueItems.length - 1; i++) {
                        const currentItem = existingQueueItems[i]
                        const nextItem = existingQueueItems[i + 1]

                        // Check for a gap between current and next item.
                        if (nextItem.newest_message_timestamp < currentItem.oldest_message_timestamp) {
                            // Found a gap, set the newestTimestamp and newestMessageId to the end of the gap.
                            console.log("➡️ ⬅️ Found a gap between current and next item")
                            console.log("1️⃣ currentItem.id", currentItem.id)
                            console.log("2️⃣ nextItem.id", nextItem.id)
                            newestTimestamp = new Date(currentItem.oldest_message_timestamp)
                            newestMessageId = currentItem.oldest_message_id
                            gapFound = true
                            break
                        }
                    }

                    // If no gap was found, find the item with the absolute oldest_message_timestamp.
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

                // Ensure the sync does not go beyond the oldestTimestampLimit.
                if (newestTimestamp < oldestTimestampLimit) {
                    // When there are no more messages to sync for a channel, the newestTimestamp will be
                    // null, which is 1970-01-01T00:00:00.000Z so will be less than the oldestTimestampLimit
                    // so this is correct response.
                    console.log(
                        `✅ The queue items already covers the range up to ${previousDays} days ago. No further sync needed.`,
                    )
                    continue
                }

                // If sync is needed, add an item to the queue then trigger that item.
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
                    throw queueItemError
                }

                // Get the id of the new queue item.
                const queueItemId = queueItem[0].id

                console.log(`🏁 Triggering new queue item: ${queueItemId}`)
                await triggerQueueItem(queueItemId)
                invokedCounter++

                // Calculate the new queue length.
                if (availableSpace <= invokedCounter >= MAX_QUEUE_LENGTH) {
                    console.log("🚧 Queue is full. Exiting.")
                    return
                }
            }
        }

        console.log("--------------------------------")
        console.log("")
        console.log("🎉 Finished processing all projects.")
    } catch (error) {
        console.error("Error in runDiscordGovernor:", error)
        throw error
    } finally {
        // Clean up the Discord client
        if (client) {
            console.log("🔌 Closing Discord client...")
            client.destroy()
        }
    }
}

async function triggerQueueItem(queueItemId) {
    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

        // Get the running queue items to see if there is space to attempt to claim.
        const { data: queueItems, error: queueError } = await supabase
            .from("discord_request_queue")
            .select("*")
            .eq("status", "running")

        if (queueError) {
            console.error("Error fetching queue items:", queueError)
            throw queueError
        }

        // Check if there is space to attempt to claim.
        const runningQueueItems = queueItems?.length || 0
        if (runningQueueItems >= MAX_QUEUE_LENGTH) {
            console.log("🚧 Queue is full. Exiting.")
            return
        }

        // If there is space, try to claim the queue item.
        const { data: claimedQueueItem, error: claimedQueueItemError } = await supabase
            .from("discord_request_queue")
            .update({ status: "running" })
            .eq("id", queueItemId)
            .eq("status", "pending")
            .select()

        if (claimedQueueItemError) {
            console.error("Error claiming queue item:", claimedQueueItemError)
            throw claimedQueueItemError
        }

        if (claimedQueueItem && claimedQueueItem.length > 0) {
            console.log(`✅ Claimed queue item: ${queueItemId}`)

            // Get the max_chars for the queue item.
            const { data: discordSignalStrength, error: discordSignalStrengthError } = await supabase
                .from("signal_strengths")
                .select("max_chars")
                .eq("name", "discord")
                .single()

            if (discordSignalStrengthError) {
                console.error("Error fetching discord signal strength:", discordSignalStrengthError)
                throw discordSignalStrengthError
            }

            const maxChars = discordSignalStrength.max_chars

            // Set the started_at timestamp to the current time.
            const { error: updatedQueueItemStartedAtError } = await supabase
                .from("discord_request_queue")
                .update({ started_at: new Date().toISOString() })
                .eq("id", queueItemId)
                .select()

            if (updatedQueueItemStartedAtError) {
                console.error("Error updating queue item started_at:", updatedQueueItemStartedAtError)
                throw updatedQueueItemStartedAtError
            }

            // Get the guild and channel to process.
            const guild = await client.guilds.fetch(claimedQueueItem[0].guild_id)
            const channel = await guild.channels.fetch(claimedQueueItem[0].channel_id)

            // This will either be an existing message id or null.
            let newestMessageId = claimedQueueItem[0].newest_message_id

            // This will be set each loop, getting incrementally older.
            let oldestMessageId = null
            let oldestMessageTimestamp = null

            // Message fetch loop.
            for (let i = 0; i < MAX_PAGINATION_LOOPS; i++) {
                // Rate limiter logic
                // Ensures that only MAX_REQUESTS_PER_SECOND_PER_CHANNEL requests are made per second per channel.
                if (!channel._requestTimestamps) channel._requestTimestamps = []
                const now = Date.now()
                channel._requestTimestamps = channel._requestTimestamps.filter((ts) => now - ts < 1000)
                if (channel._requestTimestamps.length >= MAX_REQUESTS_PER_SECOND_PER_CHANNEL) {
                    const waitTime = 1000 - (now - channel._requestTimestamps[0])
                    console.log(`⏳ Rate limit hit, waiting ${waitTime}ms before next request...`)
                    await new Promise((res) => setTimeout(res, waitTime))
                }
                channel._requestTimestamps.push(Date.now())

                // Start loop logic after rate limit delay.
                console.log(`🔄 Loop ${i + 1} of ${MAX_PAGINATION_LOOPS}`)

                // Fetch messages from the channel.
                const messages = await channel.messages.fetch({
                    limit: MAX_MESSAGES_TO_PROCESS,
                    before: newestMessageId,
                })

                // Check if there are any messages to process.
                if (messages.size > 0) {
                    // This will only happen on the first loop if newestMessageId is null (e.g. a head sync)
                    // as on the second loop newestMessageId will have been set.
                    if (!newestMessageId) {
                        newestMessageId = messages.first().id

                        console.log(`📣 Head sync detected.`)

                        // Set the newest_message_id to the newest message in the channel.
                        const { error: setNewestMessageIdError } = await supabase
                            .from("discord_request_queue")
                            .update({ newest_message_id: newestMessageId })
                            .eq("id", queueItemId)
                            .select()

                        if (setNewestMessageIdError) {
                            console.error("Error updating newest_message_id:", setNewestMessageIdError)
                            throw setNewestMessageIdError
                        }
                    }

                    // Set the oldest message found in this loop.
                    oldestMessageId = messages.last().id
                    oldestMessageTimestamp = messages.last().createdTimestamp

                    // Set the newestMessageId for the next iteration to the oldest message from this batch.
                    // This ensures we move backward through the message history.
                    newestMessageId = oldestMessageId

                    // Collect all valid messages to insert in one go
                    let messagesToInsert = []
                    let messageIdToMsg = {}
                    messages.forEach((msg) => {
                        if (msg.content.length < MIN_MESSAGE_CHAR_LENGTH) {
                            console.log(
                                `⏭️ Skipping message: ${msg.id}. Shorter than ${MIN_MESSAGE_CHAR_LENGTH} characters`,
                            )
                            return
                        }

                        // If message meets min char length, add it to the messagesToInsert array.
                        messagesToInsert.push({
                            message_id: msg.id,
                            guild_id: guild.id,
                            channel_id: channel.id,
                            discord_user_id: msg.author.id,
                            content: msg.content,
                            created_timestamp: new Date(msg.createdTimestamp).toISOString(),
                        })
                        messageIdToMsg[msg.id] = msg
                    })

                    if (messagesToInsert.length > 0) {
                        // Fetch existing message_ids for this batch
                        const messageIds = messagesToInsert.map((m) => m.message_id)
                        const { data: existingRows, error: existingRowsError } = await supabase
                            .from("discord_messages")
                            .select("message_id")
                            .in("message_id", messageIds)
                        if (existingRowsError) {
                            console.error("Error fetching existing message IDs:", existingRowsError)
                            throw existingRowsError
                        }
                        const existingIdSet = new Set((existingRows || []).map((row) => row.message_id))

                        // If all processed messages were already stored, break
                        if (
                            messagesToInsert.length > 0 &&
                            messagesToInsert.every((m) => existingIdSet.has(m.message_id))
                        ) {
                            console.log(`⏹️ All messages in this loop already existed in DB. Breaking out of loop.`)
                            break
                        }

                        // Sanitize the message content before storing it in the DB.
                        messagesToInsert.forEach((m) => {
                            m.content = outOfCharacter.replace(m.content)

                            // Truncate the message content if it exceeds the max_chars.
                            if (m.content.length > maxChars) {
                                m.content = m.content.slice(0, maxChars)
                            }
                        })

                        // Bulk upsert with onConflict to skip duplicates (will update existing rows if conflict)
                        // upsert stops edge cases where messages could be missed.
                        const { error: upsertError } = await supabase
                            .from("discord_messages")
                            .upsert(messagesToInsert, { onConflict: ["message_id"] })
                            .select()

                        if (upsertError) {
                            console.error("Error upserting messages:", upsertError)
                            throw upsertError
                        }

                        // Log for each message whether it was newly stored or already existed
                        messagesToInsert.forEach((msgObj) => {
                            if (existingIdSet.has(msgObj.message_id)) {
                                console.log(`☑️ Message already stored in DB: ${msgObj.message_id}`)
                            } else {
                                console.log(`💾 Stored message: ${msgObj.message_id}`)
                            }
                        })
                    } else {
                        console.log("⏹️ No valid messages to insert in this loop.")
                        break
                    }
                } else {
                    console.log("⏹️ No messages to process. Breaking out of loop.")
                    break
                }
            }

            // Once the loop is complete, update the queue item to "completed"
            const { error: updatedQueueItemError } = await supabase
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
                throw updatedQueueItemError
            } else {
                console.log(`💾 Updated queue item: ${queueItemId}`)
            }
            return
        } else {
            console.log(`❌ Failed to claim queue item: ${queueItemId}`)
            return
        }
    } catch (error) {
        console.error("Error in triggerQueueItem:", error)
        throw error
    }
}

// Export the runDiscordGovernor function for use in Lambda
module.exports = { runDiscordGovernor }
