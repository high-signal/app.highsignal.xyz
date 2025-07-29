require("dotenv").config({ path: "../../../../.env" })
const { createClient } = require("@supabase/supabase-js")
const { createReadyDiscordClient } = require("./discordClient")
const outOfCharacter = require("out-of-character")

// ==========
// Constants
// ==========
const {
    MAX_REQUESTS_PER_SECOND_PER_CHANNEL,
    MAX_QUEUE_LENGTH,
    MAX_MESSAGES_TO_PROCESS,
    MAX_PAGINATION_LOOPS,
    MIN_MESSAGE_CHAR_LENGTH,
} = require("./constants")

async function runDiscordQueueItem({ queueItemId }) {
    // ==========================
    // Create the Discord client
    // ==========================
    const client = await createReadyDiscordClient()

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
        console.error("Error in runDiscordQueueItem:", error)
        throw error
    } finally {
        // Clean up the Discord client
        if (client) {
            console.log("🔌 Closing Discord client...")
            client.destroy()
        }
    }
}

module.exports = { runDiscordQueueItem }
