import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import { updatePrivyAccounts } from "../../../../../../utils/updatePrivyAccounts"

// This function is used to backfill missing Discord user IDs
// When the Discord OAuth was first implemented, the user IDs were not stored in the database
// This function has been implemented to backfill the missing user IDs
// and could be used to backfill other missing Discord user IDs in the future
// Example usage:
// http://localhost:3000/api/superadmin/users/trigger-update/privy-accounts?targetUsername=eridian
// POST
// Setting correct bearer token in the request headers
export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const targetUsername = searchParams.get("targetUsername")

    if (!targetUsername) {
        return NextResponse.json({ error: "Target username is required" }, { status: 400 })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get the target user
    const { data: userData, error: userDataError } = await supabase
        .from("users")
        .select("id, privy_id, username")
        .eq("username", targetUsername)
        .single()

    if (userDataError) {
        console.error("Error fetching users:", userDataError.message)
        return NextResponse.json({ error: "Error fetching users" }, { status: 500 })
    }

    // For the target user, update the Privy accounts
    try {
        console.log(`Updating Privy accounts for ${userData.username}...`)
        await updatePrivyAccounts(userData.privy_id, userData.username)
        console.log(`Privy accounts updated for ${userData.username}.`)
    } catch (error) {
        console.error("Error updating Privy accounts:", error)
        return NextResponse.json({ error: "Error updating Privy accounts" }, { status: 500 })
    }

    // Return response with pagination info
    return NextResponse.json(
        {
            message: `Privy accounts updated for ${userData.username}.`,
        },
        { status: 200 },
    )
}
