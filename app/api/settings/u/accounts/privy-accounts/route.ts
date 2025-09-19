import { createClient } from "@supabase/supabase-js"
import { updatePrivyAccounts } from "../../../../../../utils/updatePrivyAccounts"
import { sanitize } from "../../../../../../utils/sanitize"
import { NextRequest, NextResponse } from "next/server"
import { triggerLambda } from "../../../../../../utils/lambda-utils/triggerLambda"

// This function is used to get the public and shared user accounts for a user
export async function GET(request: NextRequest) {
    const targetUsername = request.nextUrl.searchParams.get("username")!
    if (!targetUsername) {
        return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Lookup user, their accounts, and shared account data in a single query
    const { data: userWithAccounts, error: userAccountsError } = await supabase
        .from("users")
        .select(
            `
            id,
            user_accounts (
                user_id,
                type,
                is_public,
                user_accounts_shared (
                    user_account_id,
                    project_id,
                    project: projects!user_accounts_shared_project_id_fkey (
                        url_slug,
                        display_name,
                        project_logo_url
                    )
                )
            )
        `,
        )
        .eq("username", targetUsername)
        .single()
    if (userAccountsError) {
        console.error("Error looking up user and accounts. Error code: 6RVX91:", userAccountsError)
        return NextResponse.json({ error: "Error fetching user accounts. Error code: 6RVX91" }, { status: 500 })
    }

    // Format response to only include the user_accounts_shared data with camelCase field names
    const formattedUserAccounts = userWithAccounts.user_accounts.map((account) => {
        return {
            userId: account.user_id,
            type: account.type,
            isPublic: account.is_public,
            userAccountsShared: account.user_accounts_shared.map((shared) => {
                const project = Array.isArray(shared.project) ? shared.project[0] : shared.project
                return {
                    userAccountId: shared.user_account_id,
                    projectId: shared.project_id,
                    project: project
                        ? {
                              projectUrlSlug: project.url_slug,
                              projectDisplayName: project.display_name,
                              projectLogoUrl: project.project_logo_url,
                          }
                        : null,
                }
            }),
        }
    })

    return NextResponse.json(formattedUserAccounts)
}

// This function is used to update the sharing status for a user account
export async function PUT(request: NextRequest) {
    try {
        // Get the target username and account type from the URL search params
        const targetUsername = request.nextUrl.searchParams.get("username")
        const accountType = request.nextUrl.searchParams.get("accountType")
        if (!targetUsername || !accountType) {
            return NextResponse.json({ error: "Username and accountType are required" }, { status: 400 })
        }

        // Parse the request body
        const body = await request.json()
        const { changedFields } = body

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Get the target user
        const { data: targetUser, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("username", targetUsername)
            .single()

        if (userError) {
            console.error("Error fetching user:", userError)
            return NextResponse.json({ error: "Error fetching user" }, { status: 500 })
        }

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Validate the sharing setting if provided
        if (changedFields.sharing) {
            const validSharingValues = ["private", "public", "shared"]
            if (!validSharingValues.includes(changedFields.sharing)) {
                return NextResponse.json(
                    { error: "Sharing value must be 'private', 'public', or 'shared'" },
                    { status: 400 },
                )
            }

            if (changedFields.sharing === "shared" && changedFields.projectsSharedWith?.length === 0) {
                return NextResponse.json(
                    { error: "To use the 'Shared' option you must select at least one project" },
                    { status: 400 },
                )
            }
        }

        // ************************************************
        // SANITIZE USER INPUTS BEFORE STORING IN DATABASE
        // ************************************************
        const sanitizedFields: Record<string, any> = {}
        if (changedFields.projectsSharedWith)
            sanitizedFields.projectsSharedWith = sanitize(changedFields.projectsSharedWith)

        // Update the is_public field in the user_accounts table
        if (changedFields.sharing !== undefined) {
            // First check if the user account record exists
            const { data: existingUserAccount, error: checkError } = await supabase
                .from("user_accounts")
                .select("id")
                .eq("user_id", targetUser.id)
                .eq("type", accountType)
                .single()

            if (checkError && checkError.code !== "PGRST116") {
                console.error("Error checking user account:", checkError)
                return NextResponse.json({ error: "Error checking user account" }, { status: 500 })
            }

            if (existingUserAccount) {
                // Record exists, update it
                const { error: updateUserAccountError } = await supabase
                    .from("user_accounts")
                    .update({
                        is_public: changedFields.sharing === "public",
                    })
                    .eq("id", existingUserAccount.id)
                    .select()
                    .single()

                if (updateUserAccountError) {
                    console.error("Error updating user account:", updateUserAccountError)
                    return NextResponse.json({ error: "Error updating user account" }, { status: 500 })
                }
            } else {
                // Record does not exist, insert it
                const { error: insertUserAccountError } = await supabase
                    .from("user_accounts")
                    .insert({
                        user_id: targetUser.id,
                        type: accountType,
                        is_public: changedFields.sharing === "public",
                    })
                    .select()
                    .single()

                if (insertUserAccountError) {
                    console.error("Error inserting user account:", insertUserAccountError)
                    return NextResponse.json({ error: "Error inserting user account" }, { status: 500 })
                }
            }
        }

        // Get the user_account_id for the target account
        const { data: userAccountData, error: userAccountError } = await supabase
            .from("user_accounts")
            .select("id")
            .eq("user_id", targetUser.id)
            .eq("type", accountType)
            .single()

        if (userAccountError) {
            console.error("Error fetching user account:", userAccountError)
            return NextResponse.json({ error: "Error fetching user account" }, { status: 500 })
        }

        // Get all the projectIds using the projectsSharedWith array
        const sharedProjectIds = await supabase
            .from("projects")
            .select("id")
            .in("url_slug", sanitizedFields?.projectsSharedWith?.split(",") || [])

        if (sharedProjectIds.error) {
            console.error("Error fetching shared projects:", sharedProjectIds.error)
            return NextResponse.json({ error: "Error fetching shared projects" }, { status: 500 })
        }

        // In the user_accounts_shared table, delete any existing entries
        // that no longer exist in the projectsSharedWith array
        const { error: deleteUserAccountsSharedError } = await supabase
            .from("user_accounts_shared")
            .delete()
            .eq("user_account_id", userAccountData.id)
            .not("project_id", "in", `(${sharedProjectIds.data?.map((project) => project.id)?.join(",")})`)

        if (deleteUserAccountsSharedError) {
            console.error("Error deleting user accounts shared:", deleteUserAccountsSharedError)
            return NextResponse.json({ error: "Error deleting user accounts shared" }, { status: 500 })
        }

        // Add any new projectIds to the user_accounts_shared table
        const { error: addUserAccountsSharedError } = await supabase.from("user_accounts_shared").upsert(
            sharedProjectIds.data.map((project) => ({
                user_account_id: userAccountData.id,
                project_id: project.id,
            })),
            { onConflict: "user_account_id,project_id", ignoreDuplicates: true },
        )

        if (addUserAccountsSharedError) {
            console.error("Error adding user accounts shared:", addUserAccountsSharedError)
            return NextResponse.json({ error: "Error adding user accounts shared" }, { status: 500 })
        }

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error("Unhandled error in user account update:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// This function is used to update the Privy accounts for a user
export async function PATCH(request: NextRequest) {
    const privyId = request.headers.get("x-privy-id")!
    const targetUsername = request.nextUrl.searchParams.get("username")!

    await updatePrivyAccounts(privyId, targetUsername)

    return NextResponse.json({ message: "Privy accounts updated", success: true, status: 200 })
}

// This function is used to DELETE the entire Privy account for a user and the user from the database
export async function DELETE(request: NextRequest) {
    const targetUsername = request.nextUrl.searchParams.get("username")
    if (!targetUsername) {
        return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    console.log(`🎯 Target username: ${targetUsername}`)

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Lookup the Privy ID for the user
    const { data: userData, error: userDataError } = await supabase
        .from("users")
        .select("privy_id")
        .eq("username", targetUsername)
        .single()
    if (userDataError) {
        console.error("Error looking up Privy ID:", userDataError)
        return NextResponse.json({ error: "Error deleting user account. Error code: 6RVX92" }, { status: 500 })
    }
    const privyId = userData.privy_id

    try {
        const privyResponse = await fetch(`https://api.privy.io/v1/users/${privyId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Basic ${Buffer.from(
                    `${process.env.NEXT_PUBLIC_PRIVY_APP_ID}:${process.env.PRIVY_APP_SECRET}`,
                ).toString("base64")}`,
                "privy-app-id": process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
            },
        })

        if (!privyResponse.ok) {
            console.error("Privy API error:", privyResponse.status, privyResponse.statusText)
            return NextResponse.json({ error: "Error deleting user account. Error code: 9U4B2N" }, { status: 500 })
        }
    } catch (error) {
        console.error("Error deleting Privy account:", error)
        return NextResponse.json({ error: "Error deleting user account. Error code: K7LBX1" }, { status: 500 })
    }

    console.log(`⚠️ Privy account deleted for username: ${targetUsername}. Privy ID: ${privyId}`)

    // If the Privy account is deleted, delete the user from the database
    const { error: deleteUserError } = await supabase.from("users").delete().eq("username", targetUsername)
    if (deleteUserError) {
        console.error("Error deleting High Signal user:", deleteUserError)
        return NextResponse.json({ error: "Error deleting user account. Error code: XJ2AVP" }, { status: 500 })
    }

    console.log(`⚠️ High Signal user account deleted: ${targetUsername}`)

    return NextResponse.json({ message: `User account deleted: ${targetUsername}` })
}

// This function is used to trigger initial data processing for a user
export async function POST(request: NextRequest) {
    const targetUsername = request.nextUrl.searchParams.get("username")
    if (!targetUsername) {
        return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // TODO: Add other signals here
    const { error: addSingleUserDiscordAllProjectsToAiQueueError } = await supabase.rpc(
        "add_single_user_discord_all_projects_to_ai_queue",
        {
            p_username: targetUsername,
        },
    )

    if (addSingleUserDiscordAllProjectsToAiQueueError) {
        const errorMessage = `Failed to add single user Discord all projects to AI queue: ${addSingleUserDiscordAllProjectsToAiQueueError.message}`
        console.error(errorMessage)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    const runAiGovernorResponse = await triggerLambda({
        functionType: "runAiGovernor",
    })

    if (!runAiGovernorResponse.success) {
        const errorMessage = `Failed to run AI governor: ${runAiGovernorResponse.message}`
        console.error(errorMessage)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    return NextResponse.json({ message: "Analysis started", success: true, status: 200 })
}
