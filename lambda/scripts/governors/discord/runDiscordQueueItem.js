require("dotenv").config({ path: "../../../../.env" })
const { createClient } = require("@supabase/supabase-js")
const { DiscordRestApi } = require("./discordRestApi")
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
    // ===================================
    // Create the Discord REST API client
    // ===================================
    const discordApi = new DiscordRestApi()

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
            .update({ status: "running", started_at: new Date().toISOString() })
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

            // Get the guild and channel to process.
            const guildId = claimedQueueItem[0].guild_id
            const channelId = claimedQueueItem[0].channel_id

            // This will either be an existing message id or null.
            let newestMessageId = claimedQueueItem[0].newest_message_id

            // This will be set each loop, getting incrementally older.
            let oldestMessageId = null
            let oldestMessageTimestamp = null

            let totalMessagesProcessed = 0
            let totalMessagesSkipped = 0
            let totalMessagesStored = 0
            let totalMessagesAlreadyStored = 0

            // Message fetch loop.
            for (let i = 0; i < MAX_PAGINATION_LOOPS; i++) {
                console.log(`🔄 Loop ${i + 1} of ${MAX_PAGINATION_LOOPS}`)
                console.log(`   Oldest message timestamp: ${oldestMessageTimestamp}`)

                // Fetch messages from the channel using REST API.
                const messages = await discordApi.fetchMessages(channelId, {
                    limit: MAX_MESSAGES_TO_PROCESS,
                    before: newestMessageId,
                })

                console.log(`   Messages fetched: ${messages.length || 0}`)
                totalMessagesProcessed += messages.length || 0

                let messagesSkipped = 0
                let messagesStored = 0
                let messagesAlreadyStored = 0

                // Check if there are any messages to process.
                if (messages.length > 0) {
                    // This will only happen on the first loop if newestMessageId is null (e.g. a head sync)
                    // as on the second loop newestMessageId will have been set.
                    if (!newestMessageId) {
                        newestMessageId = messages[0].id

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
                    oldestMessageId = messages[messages.length - 1].id
                    oldestMessageTimestamp = new Date(messages[messages.length - 1].timestamp).getTime()

                    // Set the newestMessageId for the next iteration to the oldest message from this batch.
                    // This ensures we move backward through the message history.
                    newestMessageId = oldestMessageId

                    // Collect all valid messages to insert in one go
                    let messagesToInsert = []
                    messages.forEach((msg) => {
                        if (msg.content.length < MIN_MESSAGE_CHAR_LENGTH) {
                            // console.log(
                            //     `⏭️ Skipping message: ${msg.id}. Shorter than ${MIN_MESSAGE_CHAR_LENGTH} characters`,
                            // )
                            messagesSkipped++
                            totalMessagesSkipped++
                            return
                        }

                        // If message meets min char length, add it to the messagesToInsert array.
                        messagesToInsert.push({
                            message_id: msg.id,
                            guild_id: guildId,
                            channel_id: channelId,
                            discord_user_id: msg.author.id,
                            content: msg.content,
                            created_timestamp: new Date(msg.timestamp).toISOString(),
                        })
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
                                // console.log(`☑️ Message already stored in DB: ${msgObj.message_id}`)
                                messagesAlreadyStored++
                                totalMessagesAlreadyStored++
                            } else {
                                // console.log(`💾 Stored message: ${msgObj.message_id}`)
                                messagesStored++
                                totalMessagesStored++
                            }
                        })

                        console.log(`   Messages skipped: ${messagesSkipped}`)
                        console.log(`   Messages stored: ${messagesStored}`)
                        console.log(`   Messages already stored: ${messagesAlreadyStored}`)
                    } else {
                        console.log("⏹️ No valid messages to insert in this loop.")
                        break
                    }
                } else {
                    console.log("⏹️ No messages to process. Breaking out of loop.")
                    break
                }
            }

            console.log(`🧮 Total messages processed: ${totalMessagesProcessed}`)
            console.log(`🧮 Total messages skipped: ${totalMessagesSkipped}`)
            console.log(`🧮 Total messages stored: ${totalMessagesStored}`)
            console.log(`🧮 Total messages already stored: ${totalMessagesAlreadyStored}`)

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
        // No cleanup needed for REST API client
        console.log("✅ Discord REST API queue item processing complete")
    }
}

module.exports = { runDiscordQueueItem }
