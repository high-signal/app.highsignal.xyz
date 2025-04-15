import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { PrivyClient } from "@privy-io/server-auth"

export async function GET(request: Request) {
    try {
        // Extract the access token from the Authorization header
        const authHeader = request.headers.get("Authorization")
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 })
        }

        const accessToken = authHeader.substring(7) // Remove "Bearer " prefix

        // Initialize Privy client
        const privy = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!)

        // Verify the access token
        let verifiedClaims
        try {
            verifiedClaims = await privy.verifyAuthToken(accessToken)
        } catch (error) {
            console.error("Token verification failed:", error)
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
        }

        // Extract the user's Privy DID from the verified claims
        const privyId = verifiedClaims.userId
        if (!privyId) {
            return NextResponse.json({ error: "User ID not found in token" }, { status: 401 })
        }

        // Query Supabase for the user data
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        const { data: userData, error } = await supabase
            .from("users")
            .select("id, username, display_name, profile_image_url")
            .eq("privy_id", privyId)
            .single()

        if (error) {
            if (error.code === "PGRST116") {
                // User not found
                return NextResponse.json({ error: "User not found" }, { status: 404 })
            }
            console.error("Error fetching user:", error)
            return NextResponse.json({ error: "Error fetching user" }, { status: 500 })
        }

        return NextResponse.json(userData)
    } catch (error) {
        console.error("Unhandled error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
