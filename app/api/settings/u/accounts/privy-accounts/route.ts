import { createClient } from "@supabase/supabase-js"
import { updatePrivyAccounts } from "../../../../../../utils/updatePrivyAccounts"
import { NextRequest, NextResponse } from "next/server"

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
