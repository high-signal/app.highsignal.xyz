const { MAX_QUEUE_LENGTH } = require("../../governors/ai/constants")

async function checkRawScoreCalculationsRequired({
    supabase,
    userId,
    projectId,
    signalStrengthId,
    signalStrengthUsername,
    userDisplayName,
    dailyActivityData,
    existingUserRawData,
    testingData,
}) {
    let rawScoreCalculationsRequired = false

    // Collect all items to insert in a batch.
    const itemsToInsert = []
    const queueItemIdentifiers = []

    // Create a Set of existing days for O(1) lookup instead of O(n) find
    const existingDays = new Set(existingUserRawData.map((item) => item.day))

    for (const day of dailyActivityData) {
        if (day.data.length > 0) {
            if (existingDays.has(day.date)) {
                // Local development logging.
                if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
                    console.log(
                        `✅ Raw score for ${userDisplayName} (signalStrengthUsername: ${signalStrengthUsername}) on ${day.date} already exists in the database. Skipping...`,
                    )
                }
            } else {
                let queueItemUniqueIdentifier = `${userId}_${projectId}_${signalStrengthId}_${day.date}_RAW`
                if (testingData) {
                    queueItemUniqueIdentifier = queueItemUniqueIdentifier + "_TEST_" + testingData.requestingUserId
                }

                queueItemIdentifiers.push(queueItemUniqueIdentifier)
                itemsToInsert.push({
                    user_id: userId,
                    project_id: projectId,
                    signal_strength_id: signalStrengthId,
                    day: day.date,
                    queue_item_unique_identifier: queueItemUniqueIdentifier,
                    type: "raw_score",
                    signal_strength_username: signalStrengthUsername,
                    ...(testingData ? { test_data: testingData } : {}),
                })
            }
        }
    }

    // Batch insert all items at once.
    if (itemsToInsert.length > 0) {
        console.log(
            `🗳️ Adding ${itemsToInsert.length} raw_score queue items for ${userDisplayName} (signalStrengthUsername: ${signalStrengthUsername})`,
        )

        const { data: newQueueItems, error: addQueueItemError } = await supabase
            .from("ai_request_queue")
            .upsert(itemsToInsert, {
                onConflict: "queue_item_unique_identifier",
                ignoreDuplicates: true,
            })
            .select()

        if (addQueueItemError) {
            const errorMessage = `❌ Error adding raw_score queue items: ${addQueueItemError.message}`
            console.error(errorMessage)
            throw new Error(errorMessage)
        }

        if (newQueueItems && newQueueItems.length > 0) {
            rawScoreCalculationsRequired = true
            console.log(
                `✅ Successfully inserted ${newQueueItems.length} new queue items (${itemsToInsert.length - newQueueItems.length} duplicates skipped)`,
            )

            // Find available space in the queue.
            const { data: runningQueueItems, error: runningQueueItemsError } = await supabase
                .from("ai_request_queue")
                .select("*")
                .eq("status", "running")

            if (runningQueueItemsError) {
                const errorMessage = `Error fetching updated running queue items: ${runningQueueItemsError.message}`
                console.error(errorMessage)
                // No need to throw as this is a nice to have feature. If the queue items do not trigger here,
                // they will when the AI governor runs.
            }

            // Calculate the available space in the queue.
            const availableSpacesInQueue = MAX_QUEUE_LENGTH - (runningQueueItems?.length || 0)

            // Only trigger items if there is available space
            if (availableSpacesInQueue > 0) {
                const itemsToTrigger = newQueueItems.slice(0, availableSpacesInQueue)
                console.log(
                    `⏩ Triggering ${itemsToTrigger.length} raw_score queue items asynchronously (${Math.max(0, newQueueItems.length - availableSpacesInQueue)} will be picked up by the governor)`,
                )

                // Fire and forget - let the governor handle retries
                Promise.all(
                    itemsToTrigger.map(async (item) => {
                        try {
                            const { handleTriggerAiQueueItem } = require("../../governors/ai/handleTriggerAiQueueItem")
                            await handleTriggerAiQueueItem({ queueItemId: item.id })
                        } catch (error) {
                            console.error(`❌ Failed to trigger queue item ${item.id}:`, error)
                        }
                    }),
                ).catch((error) => {
                    console.error("❌ Error in async trigger batch:", error)
                })
            } else {
                console.log(
                    `ℹ️ Queue is full (${runningQueueItems?.length || 0}/${MAX_QUEUE_LENGTH}). All ${newQueueItems.length} items will be picked up by the governor.`,
                )
            }
        } else {
            console.log(`ℹ️ All ${itemsToInsert.length} queue items already exist in the database.`)
        }
    }

    if (!rawScoreCalculationsRequired) {
        console.log("ℹ️ No raw score calculations are required. Continuing to smart score calculations.")
    }

    return rawScoreCalculationsRequired
}

module.exports = { checkRawScoreCalculationsRequired }
