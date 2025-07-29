const { runAiQueueItem } = require("../governors/ai/runAiQueueItem")

async function handleRunAiQueueItem({ queueItemId }) {
    // Validate required parameters for runAiQueueItem
    if (!queueItemId) {
        console.log(`Missing required parameters for runAiQueueItem: queueItemId: ${queueItemId}`)
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing required parameters for runAiQueueItem" }),
        }
    }

    console.log("🏁 Triggering AI queue item. queueItemId:", queueItemId)
    await runAiQueueItem({ queueItemId })
    console.log("🏁 AI queue item finished. queueItemId:", queueItemId)
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Analysis completed successfully" }),
    }
}

module.exports = {
    handleRunAiQueueItem,
}
