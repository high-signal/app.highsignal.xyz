import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyPermissions } from "../../../../utils/verifyPermissions"

export async function POST(request: NextRequest) {
    try {
        // Get the target username from the request body
        const { username } = await request.json()
        if (!username) {
            return NextResponse.json({ error: "Username is required" }, { status: 400 })
        }

        // Get the authorization header
        const authHeader = request.headers.get("Authorization")

        // Verify permissions of the requesting user to view the target user data
        const permissionResult = await verifyPermissions(authHeader, username)
        if (!permissionResult.success) {
            return permissionResult.error
        }

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

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

        return NextResponse.json(targetUser)
    } catch (error) {
        console.error("Error fetching user settings:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
