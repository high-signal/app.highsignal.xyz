const { createClient } = require("@supabase/supabase-js")
const { Pool } = require("pg")
const { storeStatsInDb } = require("../../stats/storeStatsInDb")

// For each signal strength, add all valid users to the AI queue
async function addAllItemsToAiQueue() {
    try {
        console.log("🏁 Adding all items to AI queue...")

        const runningInLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME && !!process.env.AWS_REGION

        if (runningInLambda) {
            const pool = new Pool({
                connectionString: process.env.SUPABASE_DB_URL_DIRECT_ACCESS,
            })

            try {
                // Call SQL functions directly to avoid Supabase RPC timeouts in Lambda
                await pool.query("select public.add_all_discourse_forum_users_to_ai_queue();")
                await pool.query("select public.add_all_discord_users_to_ai_queue();")

                // Update action count equal to number of DB functions invoked
                await storeStatsInDb({
                    actionCount: 2,
                })
            } catch (error) {
                const errorMessage = `Failed to add items to AI queue via direct DB: ${error.message}`
                console.error(errorMessage)
                throw errorMessage
            } finally {
                await pool.end()
            }
        } else {
            const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

            // ================
            // Discourse forum
            // ================
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
            const { error: addAllDiscordUsersToAiQueueError } = await supabase.rpc("add_all_discord_users_to_ai_queue")

            if (addAllDiscordUsersToAiQueueError) {
                const errorMessage = `Failed to add all discord users to AI queue: ${addAllDiscordUsersToAiQueueError.message}`
                console.error(errorMessage)
                throw errorMessage
            }

            // ==============================
            // Update action count in the DB
            // ==============================
            await storeStatsInDb({
                actionCount: 2,
            })
        }

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
