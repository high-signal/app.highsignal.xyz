const { addAllItemsToAiQueue } = require("../governors/ai/addAllItemsToAiQueue")

async function handleAddAllItemsToAiQueue() {
    try {
        await addAllItemsToAiQueue()
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "All items added to AI queue successfully" }),
        }
    } catch (error) {
        console.error("Error in handleAddAllItemsToAiQueue:", error)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error adding all items to AI queue" }),
        }
    }
}

module.exports = {
    handleAddAllItemsToAiQueue,
}
