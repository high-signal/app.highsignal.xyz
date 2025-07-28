// const { addSingleItemToAiQueue } = require("../governors/ai/addSingleItemToAiQueue")

async function handleAddSingleItemToAiQueue() {
    try {
        // await addSingleItemToAiQueue()
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Single item added to AI queue successfully" }),
        }
    } catch (error) {
        console.error("Error in handleAddSingleItemToAiQueue:", error)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error adding single item to AI queue" }),
        }
    }
}

module.exports = {
    handleAddSingleItemToAiQueue,
}
