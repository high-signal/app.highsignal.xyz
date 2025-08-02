const { createClient } = require("@supabase/supabase-js")

// For each signal strength, add all valid users to the AI queue
async function addAllItemsToForumQueue() {
    try {
        console.log("🏁 Adding all items to forum queue...")

        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

        const { error: addAllForumUsersToForumQueueError } = await supabase.rpc("add_all_forum_users_to_forum_queue")

        if (addAllForumUsersToForumQueueError) {
            const errorMessage = `Failed to add all forum users to forum queue: ${addAllForumUsersToForumQueueError.message}`
            console.error(errorMessage)
            throw errorMessage
        }

        console.log("🎉 Finished adding all items to forum queue.")
    } catch (error) {
        const errorMessage = `Error adding all items to forum queue: ${error.message}`
        console.error(errorMessage)
        throw errorMessage
    }
}

module.exports = {
    addAllItemsToForumQueue,
}
