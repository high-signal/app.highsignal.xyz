import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyAuth } from "../../../../utils/verifyAuth"

export async function POST(request: NextRequest) {
    try {
        // Check if the user is authenticated
        const authHeader = request.headers.get("Authorization")
        const authResult = await verifyAuth(authHeader)

        // If the user is not authenticated or there is an error, return the error
        if (authResult instanceof NextResponse) return authResult

        // Get the target username from the request body
        const { username } = await request.json()
        if (!username) {
            return NextResponse.json({ error: "Username is required" }, { status: 400 })
        }

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Get the requesting user from the database for permission checking
        const { data: requestingUser, error: requestingUserError } = await supabase
            .from("users")
            .select("id, username, display_name, is_super_admin")
            .eq("privy_id", authResult.privyId)
            .single()

        if (requestingUserError) {
            console.error("Error fetching requesting user:", requestingUserError)
            return NextResponse.json({ error: "Error fetching user" }, { status: 500 })
        }

        if (!requestingUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // *************************
        //      Security Check
        // *************************
        // Check if the requesting user has permission to view the target user's data
        if (!requestingUser.is_super_admin && requestingUser.username !== username) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // Get the target user from the database
        const { data: targetUser, error: targetUserError } = await supabase
            .from("users")
            .select("id, username, display_name")
            .eq("username", username)
            .single()

        if (targetUserError) {
            console.error("Error fetching target user:", targetUserError)
            return NextResponse.json({ error: "Target user not found" }, { status: 404 })
        }

        // Check if the requesting user has permission to view the target user's data
        if (!requestingUser.is_super_admin && requestingUser.username !== targetUser.username) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        return NextResponse.json(targetUser)
    } catch (error) {
        console.error("Error fetching user settings:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
