import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyAuth } from "./verifyAuth"

/**
 * Verifies if a user has permission to access a resource
 * @param authHeader The Authorization header from the request
 * @param targetUsername The username of the target resource
 * @returns An object with success status and error message if applicable
 */
export async function verifyPermissions(
    authHeader: string | null,
    targetUsername: string,
): Promise<{
    success: boolean
    error?: NextResponse
}> {
    try {
        // Check if the user is authenticated
        const authResult = await verifyAuth(authHeader)

        // If the user is not authenticated or there is an error, return the error
        if (authResult instanceof NextResponse) {
            return {
                success: false,
                error: authResult,
            }
        }

        // Ensure privyId is defined
        if (!authResult.privyId) {
            return {
                success: false,
                error: NextResponse.json({ error: "Authentication failed" }, { status: 401 }),
            }
        }

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Get the requesting user from the database for permission checking
        const { data: requestingUser, error: requestingUserError } = await supabase
            .from("users")
            .select("id, username, is_super_admin")
            .eq("privy_id", authResult.privyId)
            .single()

        if (requestingUserError) {
            console.error("Error fetching requesting user:", requestingUserError)
            return {
                success: false,
                error: NextResponse.json({ error: "Error fetching user" }, { status: 500 }),
            }
        }

        if (!requestingUser) {
            return {
                success: false,
                error: NextResponse.json({ error: "User not found" }, { status: 404 }),
            }
        }

        // Check if the requesting user has permission to access the target resource
        if (!requestingUser.is_super_admin && requestingUser.username !== targetUsername) {
            return {
                success: false,
                error: NextResponse.json({ error: "Unauthorized" }, { status: 403 }),
            }
        }

        return { success: true }
    } catch (error) {
        console.error("Error verifying permissions:", error)
        return {
            success: false,
            error: NextResponse.json({ error: "Internal server error" }, { status: 500 }),
        }
    }
}
