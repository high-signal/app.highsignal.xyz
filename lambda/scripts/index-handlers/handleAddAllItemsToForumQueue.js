const { addAllItemsToForumQueue } = require("../governors/forum/addAllItemsToForumQueue")

async function handleAddAllItemsToForumQueue() {
    try {
        await addAllItemsToForumQueue()
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "All items added to forum queue successfully" }),
        }
    } catch (error) {
        console.error("Error in handleAddAllItemsToForumQueue:", error)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error adding all items to forum queue" }),
        }
    }
}

module.exports = {
    handleAddAllItemsToForumQueue,
}
