import { NextRequest, NextResponse } from "next/server"
import { triggerLambda } from "../../../../../utils/lambda-utils/triggerLambda"

export async function PATCH(request: NextRequest) {
    try {
        // Parse the request body
        const body = await request.json()
        const { signalStrengthName, userId, projectId, signalStrengthUsername } = body

        const analysisResponse = await triggerLambda(signalStrengthName, userId, projectId, signalStrengthUsername)
        if (!analysisResponse.success) {
            console.error("Failed to start analysis:", analysisResponse.message)
            return NextResponse.json(
                {
                    error: analysisResponse.message,
                },
                { status: 400 },
            )
        }
    } catch (error) {
        console.error("Unhandled error in user update:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
