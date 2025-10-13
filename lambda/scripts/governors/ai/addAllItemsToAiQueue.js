const { createClient } = require("@supabase/supabase-js")

const { storeStatsInDb } = require("../../stats/storeStatsInDb")

// For each signal strength, add all valid users to the AI queue
async function addAllItemsToAiQueue() {
    try {
        console.log("🏁 Adding all items to AI queue...")

        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

        // ================
        // Discourse forum
        // ================
        // - Find all projects with forum enabled
        // - For those enabled projects, find all users with forum username
        // - Add all those users to the AI queue for date yesterday
        const { error: addAllDiscourseForumUsersToAiQueueError } = await supabase.rpc(
            "add_all_discourse_forum_users_to_ai_queue",
        )

        if (addAllDiscourseForumUsersToAiQueueError) {
            const errorMessage = `Failed to add all forum users to AI queue: ${addAllDiscourseForumUsersToAiQueueError.message}`
            console.error(errorMessage)
            throw errorMessage
        }

        // ========
        // Discord
        // ========
        // - Find all users with discord username
        // - Find all projects with discord enabled
        // - Add items to the AI queue for each user for each enabled project
        const { error: addAllDiscordUsersToAiQueueError } = await supabase.rpc("add_all_discord_users_to_ai_queue")

        if (addAllDiscordUsersToAiQueueError) {
            const errorMessage = `Failed to add all discord users to AI queue: ${addAllDiscordUsersToAiQueueError.message}`
            console.error(errorMessage)
            throw errorMessage
        }

        // ==============================
        // Update action count in the DB
        // ==============================
        // Set the action count equal to the number of
        // DB functions that were invoked
        await storeStatsInDb({
            actionCount: 2,
        })

        console.log("🎉 Finished adding all items to AI queue.")
    } catch (error) {
        const errorMessage = `Error adding all items to AI queue: ${error.message}`
        console.error(errorMessage)
        throw errorMessage
    }
}

module.exports = {
    addAllItemsToAiQueue,
}
