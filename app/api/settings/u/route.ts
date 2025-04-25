import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validateUsername, validateDisplayName } from "../../../../utils/inputValidation"
import { sanitize } from "../../../../utils/sanitize"

export async function GET(request: NextRequest) {
    try {
        // Get the target username from the URL search params
        const targetUsername = request.nextUrl.searchParams.get("username")
        if (!targetUsername) {
            return NextResponse.json({ error: "Username is required" }, { status: 400 })
        }

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Get the target user from the database
        const { data: targetUser, error: targetUserError } = await supabase
            .from("users")
            .select(
                `
                id, 
                username, 
                display_name,
                profile_image_url,
                forum_users (
                    user_id,
                    project_id,
                    forum_username
                )
            `,
            )
            .eq("username", targetUsername)
            .single()

        if (targetUserError) {
            console.error("Error fetching target user:", targetUserError)
            return NextResponse.json({ error: "Target user not found" }, { status: 404 })
        }

        return NextResponse.json(targetUser)
    } catch (error) {
        console.error("Error fetching user settings:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// Authenticated PATCH request
// Updates a user in the database
// Takes a JSON body with updated parameters
export async function PATCH(request: Request) {
    try {
        // Parse the request body
        const body = await request.json()
        const { targetUsername, changedFields } = body

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
