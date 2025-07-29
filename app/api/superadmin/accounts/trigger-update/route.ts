import { NextRequest, NextResponse } from "next/server"
import { triggerLambda } from "../../../../../utils/lambda-utils/triggerLambda"

export async function PATCH(request: NextRequest) {
    try {
        // Parse the request body
        const body = await request.json()
        const { signalStrengthName, userId, projectId, signalStrengthUsername } = body

        // Prepare array of users to process
        let usersToUpdate: { userId: string; signalStrengthUsername: string }[] = []

        if (userId && signalStrengthUsername) {
            // Single user mode
            console.log("Single user mode")

            await triggerLambda({
                functionType: "addSingleItemToAiQueue",
                signalStrengthName,
                userId,
                projectId,
                signalStrengthUsername,
            })
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
