const { clearLastChecked } = require("../../engine/utils/lastCheckedUtils")

const checkQueueForStaleItems = async ({ supabase, queueDbTable, MAX_ATTEMPTS, TIMEOUT_SECONDS }) => {
    // ============================
    // Check queue for stale items
    // ============================
    // Check the queue for any items that have passed their timeout.
    // If so, increment their attempts, set their state to "error".

    // Get all items in the queue that are running.
    const { data: runningQueueItems, error: runningQueueItemsError } = await supabase
        .from(queueDbTable)
        .select("*")
        .eq("status", "running")

    if (runningQueueItemsError) {
        const errorMessage = `Error fetching running queue items: ${runningQueueItemsError.message}`
        console.error(errorMessage)
        throw errorMessage
    }

    // Check if any of these running queue items have passed their timeout or have reached the attempt limit.
    if (runningQueueItems?.length > 0) {
        for (const runningQueueItem of runningQueueItems) {
            // Convert started_at string to timestamp for comparison.
            const startedAtTimestamp = new Date(runningQueueItem.started_at).getTime()

            if (runningQueueItem.attempts >= MAX_ATTEMPTS) {
                // If attempts are greater than or equal to MAX_ATTEMPTS, set the status to "error".
                console.error(
                    `‼️ ERROR LIMIT REACHED for queue item ${runningQueueItem.id}. Setting to status "error".`,
                )
                // Only clear the last_checked value if the error was an ai_request_queue item.
                if (queueDbTable === "ai_request_queue") {
                    await clearLastChecked({
                        supabase,
                        userId: runningQueueItem.user_id,
                        projectId: runningQueueItem.project_id,
                        signalStrengthId: runningQueueItem.signal_strength_id,
                    })
                }

                const { error: updatedQueueItemError } = await supabase
                    .from(queueDbTable)
                    .update({ status: "error" })
                    .eq("id", runningQueueItem.id)

                if (updatedQueueItemError) {
                    const errorMessage = `Error updating queue item to "error" for runningQueueItem.id: ${runningQueueItem.id}. Error: ${updatedQueueItemError.message}`
                    console.error(errorMessage)
                    throw errorMessage
                }
            } else if (startedAtTimestamp < Date.now() - 1000 * TIMEOUT_SECONDS) {
                // If a queue item has been running for more than TIMEOUT_SECONDS seconds,
                // increment the attempts and set the status back to "pending".
                console.log(
                    `⚠️ Queue item ${runningQueueItem.id} has been running for more than ${TIMEOUT_SECONDS} seconds. Incrementing attempts and setting status back to "pending".`,
                )
                const { error: updatedQueueItemError } = await supabase
                    .from(queueDbTable)
                    .update({ attempts: runningQueueItem.attempts + 1, status: "pending" })
                    .eq("id", runningQueueItem.id)

                if (updatedQueueItemError) {
                    const errorMessage = `Error updating queue item to "pending" for runningQueueItem.id: ${runningQueueItem.id}. Error: ${updatedQueueItemError.message}`
                    console.error(errorMessage)
                    throw errorMessage
                }
            }
        }
    }
}

module.exports = { checkQueueForStaleItems }
