async function retryParentQueueItem({ supabase, userId, projectId, signalStrengthId, testingData }) {
    console.log("🔄 Last raw score to process, triggering the parent again.")

    // Each raw score queue item does not know its parent queue item id
    // but we can guess that it is todays date and we can guess the queue_item_unique_identifier.
    // In nearly all cases, this will be correct.
    const dateYesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]

    let queueItemUniqueIdentifier = `${userId}_${projectId}_${signalStrengthId}_${dateYesterday}`

    if (testingData) {
        queueItemUniqueIdentifier = queueItemUniqueIdentifier + "_TEST_" + testingData.requestingUserId
    }

    const { data: parentQueueItem, error: getParentQueueItemError } = await supabase
        .from("ai_request_queue")
        .select("id")
        .eq("queue_item_unique_identifier", queueItemUniqueIdentifier)
        .single()

    if (getParentQueueItemError) {
        const errorMessage = `⚠️ Error getting parent queue item: ${getParentQueueItemError.message}`
        console.error(errorMessage)
        // No need to throw since this is an optimistic update and will be retried by the governor.
    }

    if (parentQueueItem) {
        console.log(`⏩ Attempting to trigger parent queue item that was just created: ${parentQueueItem.id}`)

        try {
            // Dynamic require to avoid circular dependency
            const { handleTriggerAiQueueItem } = require("../../governors/ai/handleTriggerAiQueueItem")
            await handleTriggerAiQueueItem({ queueItemId: parentQueueItem.id })
        } catch (error) {
            console.error(`❌ Failed to trigger queue item ${parentQueueItem.id}:`, error)
            // Continue execution even if triggering fails as it will be retried by the governor.
        }
    }
}

module.exports = { retryParentQueueItem }
