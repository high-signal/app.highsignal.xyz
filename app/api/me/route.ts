import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

import { verifyAuth } from "../../../utils/verifyAuth"

export async function GET(request: Request) {
    try {
        // Check if the user is authenticated
        const authHeader = request.headers.get("Authorization")
        const authResult = await verifyAuth(authHeader)

        // If the user is not authenticated or there is an error, return the error
        if (authResult instanceof NextResponse) return authResult

        // Query Supabase for the user data
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        const { data: userData, error } = await supabase
            .from("users")
            .select("id, username, display_name, profile_image_url, is_super_admin")
            .eq("privy_id", authResult.privyId)
            .single()

        if (error) {
            if (error.code === "PGRST116") {
                // User not found
                return NextResponse.json({ error: "User not found" }, { status: 404 })
            }
            console.error("Error fetching user:", error)
            return NextResponse.json({ error: "Error fetching user" }, { status: 500 })
        }

        const formattedUserData = {
            id: userData.id,
            username: userData.username,
            displayName: userData.display_name,
            profileImageUrl: userData.profile_image_url,
            isSuperAdmin: userData.is_super_admin,
        }

        return NextResponse.json(formattedUserData)
    } catch (error) {
        console.error("Unhandled error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
