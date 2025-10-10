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

        // Process each missing Discord shell user.
        // Note: Adding an _ to the username shows that this is a shell user.
        //       Users cannot create usernames with an _ at the start.
        shellUsersToCreate = []
        for (const shellUser of discordShellUsersMissing) {
            shellUsersToCreate.push({
                discord_user_id: shellUser.discord_user_id,
                discord_username: shellUser.discord_username,
                username: `_${shellUser.discord_username}`,
                display_name: shellUser.discord_global_name,
                signup_code: "shell-user",
            })
        }

        // TODO: Remove this after testing
        console.log("🔍 Shell users to create:", shellUsersToCreate)

        // Look for any conflicting usernames
        // This is for the edge case where a user changes their Discord username and someone claims their old username.
        // This would cause an insert error because the username already exists,
        // so deleting the old shell user first is the simplest way to avoid the conflict.
        const { data: conflictingUsernames, error: conflictingUsernamesError } = await supabase
            .from("users")
            .select("username")
            .in(
                "username",
                shellUsersToCreate.map((shellUser) => shellUser.username),
            )

        if (conflictingUsernamesError) {
            const errorMessage = `Error fetching conflicting usernames: ${conflictingUsernamesError.message}`
            console.error(errorMessage)
            throw errorMessage
        }

        // Delete the conflicting usernames from the DB
        if (conflictingUsernames.length > 0) {
            console.log("⚠️ Conflicting usernames:", conflictingUsernames)

            const { error: deleteError } = await supabase
                .from("users")
                .delete()
                .in(
                    "username",
                    conflictingUsernames.map((username) => username.username),
                )
                .is("privy_id", null) // Stops a real user from being deleted

            if (deleteError) {
                const errorMessage = `Error deleting conflicting usernames: ${deleteError.message}`
                console.error(errorMessage)
                throw errorMessage
            }

            console.log("✅ Deleted conflicting usernames")
        }

        // Bulk insert the missing Discord shell users into the users table
        const { error: bulkInsertError } = await supabase
            .from("users")
            .upsert(shellUsersToCreate, { onConflict: "discord_user_id", ignoreDuplicates: true })
            .is("privy_id", null) // Stops a real user from being modified

        if (bulkInsertError) {
            const errorMessage = `Error bulk inserting discord shell users: ${bulkInsertError.message}`
            console.error(errorMessage)
            throw errorMessage
        }

        // Check the discord_shell_users_changed table to see if any shell users have been changed
        const { data: discordShellUsersChanged, error: discordShellUsersChangedError } = await supabase
            .from("discord_shell_users_changed")
            .select("*")

        if (discordShellUsersChangedError) {
            const errorMessage = `Error fetching discord shell users changed: ${discordShellUsersChangedError.message}`
            console.error(errorMessage)
            throw errorMessage
        }

        if (discordShellUsersChanged.length > 0) {
            console.log("🔍 Found", discordShellUsersChanged.length, "changed Discord shell users")
        }

        // Process each changed Discord shell user
        for (const shellUserChanged of discordShellUsersChanged) {
            // Update the users table with the new values
            const { error: updateError } = await supabase
                .from("users")
                .update({
                    discord_username: `_${shellUserChanged.discord_table_username}`,
                    display_name: shellUserChanged.discord_table_global_name,
                })
                .eq("discord_user_id", shellUserChanged.discord_user_id)
                .is("privy_id", null) // Stops a real user from being modified

            if (updateError) {
                const errorMessage = `Error updating discord shell user: ${updateError.message}`
                console.error(errorMessage)
                throw errorMessage
            }

            console.log("✅ Updated discord shell user", shellUserChanged.discord_table_username)
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
