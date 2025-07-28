import { NextRequest, NextResponse } from "next/server"
import { triggerLambda } from "../../../../../utils/lambda-utils/triggerLambda"
import { createClient } from "@supabase/supabase-js"

export async function PATCH(request: NextRequest) {
    try {
        // Parse the request body
        const body = await request.json()
        const { signalStrengthName, userId, projectId, signalStrengthUsername } = body

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Prepare array of users to process
        let usersToUpdate: { userId: string; signalStrengthUsername: string }[] = []

        if (userId && signalStrengthUsername) {
            // Single user mode
            console.log("Single user mode")

            await triggerLambda({ signalStrengthName, userId, projectId, functionType: "addSingleItemToAiQueue" })
        } else {
            // All users mode
            console.log("All users mode")
            await triggerLambda({ functionType: "addAllItemsToAiQueue" })
        }

        return NextResponse.json({ success: true, message: `Analysis triggered for ${usersToUpdate.length} user(s)` })
    } catch (error) {
        console.error("Unhandled error in user update:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
