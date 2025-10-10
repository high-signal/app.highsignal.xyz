// How to run this locally:
// node -e "require('./runShellUserGovernor.js').runShellUserGovernor().catch(console.error)"

require("dotenv").config({ path: "../../../../.env" })
const { createClient } = require("@supabase/supabase-js")
const { storeStatsInDb } = require("../../stats/storeStatsInDb")

// =================
// Run the governor
// =================
async function runShellUserGovernor() {
    console.log("💡 Running shell user governor")

    // Just run this in batches of 1000 each time the governor runs
    // TODO: Maybe it can do more if it loops, but might not need to

    // TODO: Still limit the lengths of the display name and username (as they can be massive strings)

    let shellUsersUpdated = 0

    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

        // Find missing Discord shell users
        const { data: discordShellUsersMissing, error: discordShellUsersMissingError } = await supabase
            .from("discord_shell_users_missing")
            .select("*")
            .not("discord_username", "is", null)
            .limit(3) // TODO: Remove this limit after testing

        if (discordShellUsersMissingError) {
            const errorMessage = `Error fetching discord shell users missing: ${discordShellUsersMissingError.message}`
            console.error(errorMessage)
            throw errorMessage
        }

        if (discordShellUsersMissing.length > 0) {
            console.log("🔍 Found", discordShellUsersMissing.length, "missing Discord shell users")
        }

        // Process each missing Discord shell user
        shellUsersToCreate = []
        for (const shellUser of discordShellUsersMissing) {
            shellUsersToCreate.push({
                discord_user_id: shellUser.discord_user_id,
                discord_username: shellUser.discord_username,
                username: `_${shellUser.discord_username}`,
                display_name: `_${shellUser.discord_global_name}`,
                signup_code: "shell-user",
            })
        }

        console.log("🔍 Shell users to create:", shellUsersToCreate)

        // Bulk insert the missing Discord shell users into the users table
        const { error: bulkInsertError } = await supabase
            .from("users")
            .upsert(shellUsersToCreate, { onConflict: "discord_user_id", ignoreDuplicates: true })

        if (bulkInsertError) {
            const errorMessage = `Error bulk inserting discord shell users: ${bulkInsertError.message}`
            console.error(errorMessage)
            throw errorMessage
        }

        console.log("🎉 Finished processing all shell users. Shell user governor complete.")
    } catch (error) {
        console.error("Error in runShellUserGovernor:", error)
        throw error
    } finally {
        // ==============================
        // Update action count in the DB
        // ==============================
        // Set the action count equal to the number of
        // shell users that were updated.
        await storeStatsInDb({
            actionCount: shellUsersUpdated,
        })
    }
}

module.exports = { runShellUserGovernor }
