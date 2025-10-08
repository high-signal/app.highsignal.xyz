// How to run this locally:
// node -e "require('./runDiscordGovernor.js').runDiscordGovernor().catch(console.error)"

require("dotenv").config({ path: "../../../../.env" })
const { createClient } = require("@supabase/supabase-js")
const { DiscordRestApi } = require("./discordRestApi")
const { handleTriggerDiscordQueueItem } = require("./handleTriggerDiscordQueueItem")
const { storeStatsInDb } = require("../../utils/storeStatsInDb")

// ==========
// Constants
// ==========
const { MAX_QUEUE_LENGTH, TIMEOUT_SECONDS, MAX_ATTEMPTS } = require("./constants")

// =================
// Run the governor
// =================
async function runDiscordGovernor() {
    console.log("💡 Running Discord governor")
    // ===================================
    // Create the Discord REST API client
    // ===================================
    const discordApi = new DiscordRestApi()

    // Invoked counter to optimistically track
    // the number of items that have been invoked.
    let invokedCounter = 0

    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

        // ============================
        // Check queue for stale items
        // ============================
        // Check the queue for any items that have passed their timeout.
        // If so, increment their attempts, set their state to "error".

        // Get all items in the queue that are running.
        const { data: runningQueueItems, error: runningQueueItemsError } = await supabase
            .from("discord_request_queue")
            .select("*")
            .eq("status", "running")

        if (runningQueueItemsError) {
            const errorMessage = `Error fetching running queue items: ${runningQueueItemsError.message}`
            console.error(errorMessage)
            throw errorMessage
        }

        // Check if any of these have passed their timeout.
        // If so, increment their attempts, set their state to "error".
        if (runningQueueItems?.length > 0) {
            for (const queueItem of runningQueueItems) {
                // Convert started_at string to timestamp for comparison.
                const startedAtTimestamp = new Date(queueItem.started_at).getTime()

                // If a queue item has been running for more than TIMEOUT_SECONDS seconds,
                // increment the attempts and set the status to "error".
                if (startedAtTimestamp < Date.now() - 1000 * TIMEOUT_SECONDS) {
                    console.log(
                        `⚠️ Queue item ${queueItem.id} has been running for more than ${TIMEOUT_SECONDS} seconds. Incrementing attempts and setting status to "error".`,
                    )
                    const { error: updatedQueueItemError } = await supabase
                        .from("discord_request_queue")
                        .update({ attempts: queueItem.attempts + 1, status: "error" })
                        .eq("id", queueItem.id)

                    if (updatedQueueItemError) {
                        const errorMessage = `Error updating queue item to "error" for queueItem.id: ${queueItem.id}. Error: ${updatedQueueItemError.message}`
                        console.error(errorMessage)
                        throw errorMessage
                    }
                }
            }
        }

        // ===================================
        // Check available space in the queue
        // ===================================
        // Look at the DB again to get the new total
        // number of running items and available space.
        const { data: updatedRunningQueueItems, error: updatedRunningQueueItemsError } = await supabase
            .from("discord_request_queue")
            .select("*")
            .eq("status", "running")

        if (updatedRunningQueueItemsError) {
            const errorMessage = `Error fetching updated running queue items: ${updatedRunningQueueItemsError.message}`
            console.error(errorMessage)
            throw errorMessage
        }

        // Calculate the available space in the queue.
        const availableSpace = MAX_QUEUE_LENGTH - (updatedRunningQueueItems?.length || 0)

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

        console.log(`🔍 Found ${projects.length} projects with Discord enabled and URLs`)

        // Shuffle projects to avoid always processing the same ones first.
        // Useful in case of ratel-imit issues that only allow the first X projects to be processed.
        const shuffledProjects = [...projects].sort(() => Math.random() - 0.5)

        // =====================
        // Process each project
        // =====================
        for (const project of shuffledProjects) {
            let invokedCounterForProject = 0
            try {
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

                // Fetch accessible text channels in the guild
                const accessibleTextChannels = await discordApi.getAccessibleTextChannels(guildId)

                console.log(
                    `🔍 Found ${accessibleTextChannels.length} accessible text channels in Discord: ${project.projects.display_name} (${project.projects.url_slug}). Guild ID: ${guildId}`,
                )

                // Fetch all visible active threads in the guild
                const visibleActiveThreads = await discordApi.getVisibleActiveThreads(guildId)

                // Filter out threads that are not accessible
                const accessibleChannelIds = new Set(accessibleTextChannels.map((channel) => channel.id))
                const accessibleThreads = visibleActiveThreads.threads.filter((thread) =>
                    accessibleChannelIds.has(thread.parent_id),
                )

                console.log(
                    `🔍 Found ${accessibleThreads.length} accessible active threads in Discord: ${project.projects.display_name} (${project.projects.url_slug}). Guild ID: ${guildId}`,
                )

                // Combine accessible text channels and accessible threads
                const accessibleChannels = [...accessibleTextChannels, ...accessibleThreads]

                // Shuffle channels to avoid always processing the same ones first.
                // Useful in case of ratel-imit issues that only allow the first X channels to be processed.
                const shuffledChannels = [...accessibleChannels].sort(() => Math.random() - 0.5)

                // ====================================================
                // For each channel, check queue and trigger if needed
                // ====================================================
                for (const channel of shuffledChannels) {
                    const channelId = channel.id
                    // Local development logging
                    if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
                        console.log("--------------------------------")
                        console.log(
                            `⭐️ Processing Discord: ${project.projects.url_slug}. Guild ID: ${guildId}. Channel: ${channel.name} (ID: ${channelId}).`,
                        )
                    }

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
                                `🔁 Setting latest queue item (${currentQueueItem[0].id}) back to pending and trying again. Project: ${project.projects.display_name} (${project.projects.url_slug}). Guild: ${guildId}. Channel: ${channelId}.`,
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
                                await handleTriggerDiscordQueueItem({ queueItemId: currentQueueItem[0].id })
                                invokedCounter++
                                invokedCounterForProject++
                            }
                            continue
                        } else {
                            // If the number of attempts is MAX_ATTEMPTS or more, skip it.
                            // console.error(`‼️ ERROR LIMIT REACHED for queue item ${currentQueueItem[0].id}. Skipping.`)
                            continue
                        }
                    }

                    // ============================================
                    // If the currentQueueItem status is "pending"
                    // ============================================
                    // Try to trigger it again now there is space in the queue.
                    if (currentQueueItem?.length > 0 && currentQueueItem[0]?.status === "pending") {
                        console.log(
                            `🏁 Triggering pending queue item. Project: ${project.projects.display_name} (${project.projects.url_slug}). Guild: ${guildId}. Channel: ${channelId}. Queue item ID: ${currentQueueItem[0].id}`,
                        )
                        await handleTriggerDiscordQueueItem({ queueItemId: currentQueueItem[0].id })
                        invokedCounter++
                        invokedCounterForProject++
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

                    // Initialize variables to track the absolute oldest message in the queue.
                    let absoluteOldestTimestampAlreadyInQueue
                    let absoluteOldestMessageIdAlreadyInQueue

                    // Fetch any existing queue items within the time range.
                    // Using pagination to ensure we get all results.
                    let existingQueueItems = []
                    let pageSize = 1000
                    let currentPage = 0
                    let hasMoreResults = true

                    while (hasMoreResults) {
                        const from = currentPage * pageSize
                        const to = from + pageSize - 1

                        const { data: pageData, error: pageError } = await supabase
                            .from("discord_request_queue")
                            .select(
                                "id, oldest_message_timestamp, oldest_message_id, newest_message_timestamp, newest_message_id",
                            )
                            .eq("guild_id", guildId)
                            .eq("channel_id", channelId)
                            .gte("newest_message_timestamp", oldestTimestampLimit.toISOString())
                            .order("newest_message_timestamp", { ascending: false })
                            .range(from, to)

                        if (pageError) {
                            console.error("Error fetching existing queue items:", pageError)
                            throw pageError
                        }

                        if (pageData && pageData.length > 0) {
                            existingQueueItems = existingQueueItems.concat(pageData)
                            currentPage++

                            // If we got fewer results than the page size, we have reached the end
                            if (pageData.length < pageSize) {
                                hasMoreResults = false
                            }
                        } else {
                            hasMoreResults = false
                        }
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
                    let headGapFound = false
                    if (existingQueueItems.length > 0) {
                        // Check if there is a gap between the newest_message_id and the last_message_id in the channel.
                        if (existingQueueItems[0].newest_message_id !== channel.last_message_id) {
                            console.log(
                                `📣 Head gap found. Processing newest messages for Project: ${project.projects.display_name} (${project.projects.url_slug}). Guild: ${guildId}. ${channel.name} (ID: ${channelId}).`,
                            )
                            headGapFound = true
                            // Do nothing here as it will be processed like a new head sync
                            // since the newest_message_id will be null.
                        }
                    }

                    // If there is no head gap, check for gaps between the items in the queue.
                    // A gap is when there are two consecutive items where the newest_message_timestamp
                    // of the next item is less than the oldest_message_timestamp of the current item.
                    if (!headGapFound && existingQueueItems.length > 0) {
                        let intermediateGapFound = false

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
                                intermediateGapFound = true
                                break
                            }
                        }

                        // If no intermediate gap was found, find the queue item with the absolute oldest_message_timestamp.
                        // This is to continue the sync from the absolute oldest message to the end of the previousDays.
                        if (!intermediateGapFound) {
                            absoluteOldestTimestampAlreadyInQueue = new Date(
                                existingQueueItems[0].oldest_message_timestamp,
                            )
                            absoluteOldestMessageIdAlreadyInQueue = existingQueueItems[0].oldest_message_id

                            for (const item of existingQueueItems) {
                                const itemTimestamp = new Date(item.oldest_message_timestamp)
                                if (itemTimestamp < absoluteOldestTimestampAlreadyInQueue) {
                                    absoluteOldestTimestampAlreadyInQueue = itemTimestamp
                                    absoluteOldestMessageIdAlreadyInQueue = item.oldest_message_id
                                }
                            }

                            newestTimestamp = absoluteOldestTimestampAlreadyInQueue
                            newestMessageId = absoluteOldestMessageIdAlreadyInQueue
                        }
                    }

                    // Ensure the sync does not go beyond the oldestTimestampLimit.
                    if (newestTimestamp < oldestTimestampLimit) {
                        // When there are no more messages to sync for a channel, the newestTimestamp will be
                        // null, which is 1970-01-01T00:00:00.000Z so will be less than the oldestTimestampLimit
                        // so this is correct response.
                        const daysBetweenNowAndAbsoluteOldestTimestamp =
                            Math.floor((now - absoluteOldestTimestampAlreadyInQueue) / (1000 * 60 * 60 * 24)) + 1

                        // Local development logging
                        if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
                            console.log(
                                `✅ Queue items already cover ${previousDays} previous days. Oldest message in DB from date ${absoluteOldestTimestampAlreadyInQueue.toISOString().split("T")[0]} (${daysBetweenNowAndAbsoluteOldestTimestamp} days ago). No sync needed.`,
                            )
                        }
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
                            // oldest_message_timestamp and oldest_message_id will be set by runDiscordQueueItem
                        })
                        .select()

                    if (queueItemError) {
                        console.error("Error adding queue item:", queueItemError)
                        throw queueItemError
                    }

                    // Get the id of the new queue item.
                    const queueItemId = queueItem[0].id

                    console.log(`🏁 Triggering new queue item: ${queueItemId}`)
                    await handleTriggerDiscordQueueItem({ queueItemId })
                    invokedCounter++
                    invokedCounterForProject++

                    // Calculate the new queue length.
                    if (availableSpace <= invokedCounter >= MAX_QUEUE_LENGTH) {
                        console.log("🚧 Queue is full. Exiting.")
                        return
                    }
                }
                console.log(
                    `Invoked ${invokedCounterForProject} Discord queue items for project: ${project.projects.display_name} (${project.projects.url_slug}).`,
                )
            } catch (error) {
                console.error("Error in runDiscordGovernor for project:", project.projects.display_name, error)
                continue
            }
        }

        console.log("--------------------------------")
        console.log("")
        console.log("🎉 Finished triggering Discord queue items. Discord governor complete.")
    } catch (error) {
        console.error("Error in runDiscordGovernor:", error)
        throw error
    } finally {
        // ==============================
        // Update action count in the DB
        // ==============================
        // Set the action count equal to the number of
        // AI queue items that were triggered
        await storeStatsInDb({
            actionCount: invokedCounter,
        })

        console.log("✅ Discord REST API governor complete")
    }
}

module.exports = { runDiscordGovernor }
