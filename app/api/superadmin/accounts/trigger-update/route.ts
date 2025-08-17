import { NextRequest, NextResponse } from "next/server"
import { triggerLambda } from "../../../../../utils/lambda-utils/triggerLambda"

// Add all items or a single item to the AI queue
export async function PATCH(request: NextRequest) {
    try {
        // Parse the request body
        const body = await request.json()
        const { signalStrengthName, userId, projectId, signalStrengthUsername } = body

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

        return NextResponse.json({ success: true, message: `Analysis triggered for ${signalStrengthUsername}.` })
    } catch (error) {
        console.error("Unhandled error in user update:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// Trigger Lambda function
export async function POST(request: NextRequest) {
    const functionType = request.nextUrl.searchParams.get("functionType")

    try {
        if (!functionType) {
            return NextResponse.json({ error: "Missing required parameter: functionType" }, { status: 400 })
        }

        console.log(`🏁 Triggering ${functionType}`)
        await triggerLambda({ functionType })

        return NextResponse.json({ success: true, message: `Triggered ${functionType}.` })
    } catch (error) {
        console.error("Unhandled error in user update:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
