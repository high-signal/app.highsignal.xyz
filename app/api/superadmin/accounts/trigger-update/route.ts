import { NextRequest, NextResponse } from "next/server"
import { triggerForumAnalysis } from "../../../../../utils/lambda-utils/forumAnalysis"

export async function PATCH(request: NextRequest) {
    try {
        // Parse the request body
        const body = await request.json()
        const { signalStrengthName, userId, projectId, signalStrengthUsername } = body

        if (signalStrengthName === "discourse_forum") {
            const result = await triggerForumAnalysis(userId, projectId, signalStrengthUsername)

            if (result.success) {
                return NextResponse.json({ success: true })
            } else {
                return NextResponse.json({ error: "Failed to trigger forum analysis" }, { status: 500 })
            }
        } else {
            return NextResponse.json(
                { error: `Signal strength (${signalStrengthName}) not configured for triggering updates` },
                { status: 404 },
            )
        }
    } catch (error) {
        console.error("Unhandled error in user update:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
