import { createClient } from "@supabase/supabase-js"
import { fetchUserData } from "./fetchUserData"

// Mapping of Privy auth types to database column names and Privy account field names
const AUTH_TYPE_MAPPING = {
    email: { dbColumn: "email", privyField: "address" },
    discord_oauth: { dbColumn: "discord_username", privyField: "username" },
    // privy_type: { dbColumn: "db_column_name", privyField: "privy_field_name" }
} as const

export async function updatePrivyAccounts(privyId: string, targetUsername: string) {
    // Get user data directly from Privy API using the privyId
    try {
        // If current user is the target user, update their Privy accounts
        const { data: loggedInUser, error: loggedInUserError } = await fetchUserData(privyId)

        // This check is important to not overwrite the details of the target user with the logged in user details
        if (!loggedInUserError && loggedInUser?.username === targetUsername) {
            const privyResponse = await fetch(`https://api.privy.io/v1/users/${privyId}`, {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_PRIVY_APP_ID}:${process.env.PRIVY_APP_SECRET}`).toString("base64")}`,
                    "privy-app-id": process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
                },
            })

            if (privyResponse.ok) {
                // Create DB client
                const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

                const privyUser = await privyResponse.json()

                // Process each auth type mapping
                for (const [authType, { dbColumn, privyField }] of Object.entries(AUTH_TYPE_MAPPING)) {
                    // Find the account from linked_accounts
                    const account = privyUser.linked_accounts?.find((account: any) => account.type === authType)

                    if (account) {
                        // TODO: Look in the DB first, if there are any existing
                        // either do nothing if it is already for this user or
                        // delete any other user duplicate values

                        // If an account is found, update the user data in the database
                        const { error: updateError } = await supabase
                            .from("users")
                            .update({ [dbColumn]: account[privyField] })
                            .eq("privy_id", privyId)

                        if (updateError) {
                            console.error(`Error updating user ${dbColumn}:`, updateError)
                        }
                    } else {
                        // If no account is found, delete the user data from the database
                        const { error: deleteError } = await supabase
                            .from("users")
                            .update({ [dbColumn]: null })
                            .eq("privy_id", privyId)

                        if (deleteError) {
                            console.error(`Error deleting user ${dbColumn}:`, deleteError)
                        }
                    }
                }
            } else {
                console.error("Failed to fetch user from Privy API:", privyResponse.status)
            }
        } else {
            console.error(
                "Requesting user is not the target user. Privy accounts can only be updated by the target user.",
            )
            return
        }
    } catch (error) {
        console.error("Error fetching user data from Privy API:", error)
    }
}
