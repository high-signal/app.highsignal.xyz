import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validateUsername, validateDisplayName } from "../../../../utils/inputValidation"
import { sanitize } from "../../../../utils/sanitize"
import { updatePrivyAccounts } from "../../../../utils/updatePrivyAccounts"

export async function GET(request: NextRequest) {
    try {
        // Get the target username from the URL search params
        const targetUsername = request.nextUrl.searchParams.get("username")
        if (!targetUsername) {
            return NextResponse.json({ error: "Username is required" }, { status: 400 })
        }

        // Update the target user Privy accounts
        const privyId = request.headers.get("x-privy-id")!
        await updatePrivyAccounts(privyId, targetUsername)

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Get the target user from the database
        const { data: targetUser, error: targetUserError } = await supabase
            .from("users")
            .select(
                `
                username, 
                display_name,
                profile_image_url,
                default_profile,
                email,
                discord_username,
                x_username,
                farcaster_username,
                forum_users (
                    forum_username,
                    auth_encrypted_payload,
                    auth_post_id,
                    auth_post_code,
                    auth_post_code_created,
                    projects!inner (
                        url_slug
                    )
                ),
                user_addresses (
                address,
                address_name,
                is_public,
                    user_addresses_shared (
                        projects (
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

        if (targetUserError) {
            console.error("Error fetching target user:", targetUserError)
            return NextResponse.json({ error: "Target user not found" }, { status: 404 })
        }

        const formattedTargetUser: UserData = {
            username: targetUser.username,
            displayName: targetUser.display_name,
            profileImageUrl: targetUser.profile_image_url,
            defaultProfile: targetUser.default_profile,
            email: targetUser.email,
            discordUsername: targetUser.discord_username,
            xUsername: targetUser.x_username,
            farcasterUsername: targetUser.farcaster_username,
            forumUsers: targetUser.forum_users.map((forumUser: any) => ({
                projectUrlSlug: forumUser.projects.url_slug,
                forumUsername: forumUser.forum_username,
                authEncryptedPayload: forumUser.auth_encrypted_payload,
                authPostId: forumUser.auth_post_id,
                authPostCode: forumUser.auth_post_code,
                authPostCodeCreated: forumUser.auth_post_code_created,
            })),
            userAddresses: targetUser.user_addresses.map((userAddress: any) => ({
                address: userAddress.address,
                addressName: userAddress.address_name,
                isPublic: userAddress.is_public,
                userAddressesShared: userAddress.user_addresses_shared.map((userAddressShared: any) => ({
                    projectUrlSlug: userAddressShared.projects.url_slug,
                    projectDisplayName: userAddressShared.projects.display_name,
                    projectLogoUrl: userAddressShared.projects.project_logo_url,
                })),
            })),
        }

        return NextResponse.json(formattedTargetUser)
    } catch (error) {
        console.error("Error fetching user settings:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// Authenticated PATCH request
// Updates a user in the database
// Takes a JSON body with updated parameters
export async function PATCH(request: NextRequest) {
    try {
        // Get the target username from the URL search params
        const targetUsername = request.nextUrl.searchParams.get("username")
        if (!targetUsername) {
            return NextResponse.json({ error: "Username is required" }, { status: 400 })
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

        // Validate username if provided
        if (changedFields.username) {
            const usernameError = validateUsername(changedFields.username.toLowerCase())
            if (usernameError) {
                return NextResponse.json({ error: usernameError }, { status: 400 })
            }

            // Check if username is already taken by another user
            const { data: existingUser, error: existingUserError } = await supabase
                .from("users")
                .select("id")
                .eq("username", changedFields.username.toLowerCase())
                .neq("id", targetUser.id)
                .single()

            if (existingUserError && existingUserError.code !== "PGRST116") {
                console.error("Error checking username:", existingUserError)
                return NextResponse.json({ error: "Error checking username" }, { status: 500 })
            }

            if (existingUser) {
                return NextResponse.json({ error: "Username is already taken" }, { status: 409 })
            }
        }

        // Validate display name if provided
        if (changedFields.displayName) {
            const displayNameError = validateDisplayName(changedFields.displayName.toLowerCase())
            if (displayNameError) {
                return NextResponse.json({ error: displayNameError }, { status: 400 })
            }
        }

        // ************************************************
        // SANITIZE USER INPUTS BEFORE STORING IN DATABASE
        // ************************************************
        const updateData: Record<string, any> = {}
        if (changedFields.username) updateData.username = sanitize(changedFields.username.toLowerCase())
        if (changedFields.displayName) updateData.display_name = sanitize(changedFields.displayName)

        // If the user updates their username or display name, set their default profile flag to false
        updateData.default_profile = false

        // Update user
        const { data: updatedUser, error: updateError } = await supabase
            .from("users")
            .update(updateData)
            .eq("id", targetUser.id)
            .select()
            .single()

        if (updateError) {
            console.error("Error updating user:", updateError)
            return NextResponse.json({ error: "Error updating user" }, { status: 500 })
        }

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error("Unhandled error in user update:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
