const { triggerDiscordQueueItem } = require("../governors/discord/triggerDiscordQueueItem")

async function handleRunDiscordQueueItem({ queueItemId }) {
    // Validate required parameters for runDiscordQueueItem
    if (!queueItemId) {
        console.log(`Missing required parameters for runDiscordQueueItem: queueItemId: ${queueItemId}`)
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing required parameters for runDiscordQueueItem" }),
        }
    }

    console.log("🏁 Triggering Discord queue item. queueItemId:", queueItemId)
    await triggerDiscordQueueItem({ queueItemId })
    console.log("🏁 Discord queue item finished. queueItemId:", queueItemId)
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Analysis completed successfully" }),
    }
}

module.exports = {
    handleRunDiscordQueueItem,
}
