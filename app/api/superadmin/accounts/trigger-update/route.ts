import { NextRequest, NextResponse } from "next/server"
import { triggerForumAnalysis } from "../../../../../utils/lambda-utils/forumAnalysis"

export async function PATCH(request: NextRequest) {
    try {
        // Parse the request body
        const body = await request.json()
        const { signalStrengthName, userId, projectId, forumUsername } = body

        if (signalStrengthName === "discourse_forum") {
            const result = await triggerForumAnalysis(userId, projectId, forumUsername)

            if (result.success) {
                return NextResponse.json({ success: true })
            } else {
                return NextResponse.json({ error: "Failed to trigger forum analysis" }, { status: 500 })
            }
        }

        return NextResponse.json({ success: false, error: "Invalid signal strength name" }, { status: 400 })
    } catch (error) {
        console.error("Unhandled error in user update:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
