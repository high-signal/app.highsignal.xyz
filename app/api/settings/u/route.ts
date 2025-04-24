import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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
