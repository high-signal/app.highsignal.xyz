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

    for (const day of dailyActivityData) {
        if (day.data.length > 0) {
            if (
                !testingData &&
                existingUserRawData.length > 0 &&
                existingUserRawData.find((item) => item.day === day.date)
            ) {
                console.log(
                    `✅ Raw score for ${userDisplayName} (signalStrengthUsername: ${signalStrengthUsername}) on ${day.date} already exists in the database. Skipping...`,
                )
            } else {
                console.log(
                    `🗳️ Adding raw_score queue item for ${userDisplayName} (signalStrengthUsername: ${signalStrengthUsername}) on ${day.date}`,
                )
                rawScoreCalculationsRequired = true

                const queueItemUniqueIdentifier = `${userId}_${projectId}_${signalStrengthId}_${day.date}_RAW`

                // Add item to ai_request_queue
                const { data: newQueueItem, error: addQueueItemError } = await supabase
                    .from("ai_request_queue")
                    .insert({
                        user_id: userId,
                        project_id: projectId,
                        signal_strength_id: signalStrengthId,
                        day: day.date,
                        queue_item_unique_identifier: queueItemUniqueIdentifier,
                        type: "raw_score",
                        signal_strength_username: signalStrengthUsername,
                        ...(testingData ? { testing_data: testingData } : {}),
                    })
                    .select()

                if (addQueueItemError) {
                    if (addQueueItemError.code === "23505") {
                        // 23505 = unique_violation in Postgres
                        console.warn(`Queue item already exists for identifier ${queueItemUniqueIdentifier}`)
                        // No throw — fail gracefully
                    } else {
                        const errorMessage = `Error adding raw_score queue item: ${addQueueItemError.message}`
                        console.error(errorMessage)
                        throw new Error(errorMessage)
                    }
                }

                // Attempt to trigger raw_score queue item that was just created
                if (newQueueItem && newQueueItem.length > 0) {
                    console.log(
                        `⏩ Attempting to trigger raw_score queue item that was just created: ${newQueueItem[0].id}`,
                    )

                    try {
                        // Dynamic require to avoid circular dependency
                        const { handleTriggerAiQueueItem } = require("../../governors/ai/handleTriggerAiQueueItem")
                        await handleTriggerAiQueueItem({ queueItemId: newQueueItem[0].id })
                    } catch (error) {
                        console.error(`❌ Failed to trigger queue item ${newQueueItem[0].id}:`, error)
                        // Continue execution even if triggering fails as it will be retried by the governor.
                    }
                }
            }
        }
    }

    if (!rawScoreCalculationsRequired) {
        console.log("ℹ️ No raw score calculations are required. Continuing to smart score calculations.")
    }

    return rawScoreCalculationsRequired
}

module.exports = { checkRawScoreCalculationsRequired }
