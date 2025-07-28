const { createClient } = require("@supabase/supabase-js")

// For each signal strength, add all valid users to the AI queue
async function addAllItemsToAiQueue() {
    try {
        console.log("Adding all items to AI queue...")

        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

        // ================
        // Discourse forum
        // ================
        // - Find all projects with forum enabled
        // - For those enabled projects, find all users with forum username
        // - Add all those users to the AI queue for date yesterday

        const { error: discourseForumError } = await supabase.rpc("add_all_discourse_forum_users_to_ai_queue")

        if (discourseForumError) {
            const errorMessage = `Failed to add all forum users to AI queue: ${discourseForumError.message}`
            console.error(errorMessage)
            throw errorMessage
        }
    } catch (error) {
        const errorMessage = `Error adding all items to AI queue: ${error.message}`
        console.error(errorMessage)
        throw errorMessage
    }
}

module.exports = {
    addAllItemsToAiQueue,
}
