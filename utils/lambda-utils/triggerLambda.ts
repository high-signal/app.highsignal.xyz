// @ts-ignore
import { analyzeForumUserActivity } from "../../lambda/scripts/discourse-forum/analyzeForumUserActivity"

export async function triggerLambda(
    signalStrengthName: string,
    userId: string,
    projectId: string,
    signalStrengthUsername: string,
    testingData?: {
        requestingUserId: string
        testingInputData: {
            rawTestingInputData?: TestingInputData
            smartTestingInputData?: TestingInputData
        }
    },
) {
    const LAMBDA_FUNCTION_URL = process.env.LAMBDA_FUNCTION_URL
    const LAMBDA_API_KEY = process.env.LAMBDA_API_KEY

    if (signalStrengthName != "discourse_forum") {
        return {
            success: false,
            message: `Signal strength (${signalStrengthName}) not configured for updates`,
        }
    }

    if (LAMBDA_FUNCTION_URL) {
        // Execute on AWS Lambda
        console.log("Executing on AWS Lambda")
        try {
            // Don't await the full response, just check that it starts successfully
            fetch(LAMBDA_FUNCTION_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": LAMBDA_API_KEY || "",
                },
                body: JSON.stringify({
                    signalStrengthName,
                    userId,
                    projectId,
                    signalStrengthUsername,
                    async: true,
                    ...(testingData && { testingData }),
                }),
            })

            return {
                success: true,
                message: "Analysis initiated successfully",
                data: {
                    signalStrengthName,
                    userId,
                    projectId,
                    signalStrengthUsername,
                },
            }
        } catch (error) {
            console.error("Error sending forum analysis request:", error)
            return {
                success: false,
                message: error instanceof Error ? error.message : "Failed to start analysis",
                error: error,
            }
        }
    } else {
        // Execute locally
        console.log("Executing locally")
        if (signalStrengthName === "discourse_forum") {
            analyzeForumUserActivity(userId, projectId, signalStrengthUsername, testingData)
            return {
                success: true,
                message: "Analysis initiated successfully",
                data: {
                    signalStrengthName,
                    userId,
                    projectId,
                    signalStrengthUsername,
                    ...(testingData && { testingData }),
                },
            }
        } else {
            console.log(`Signal strength (${signalStrengthName}) not configured for updates`)
            return {
                success: false,
                message: `Signal strength (${signalStrengthName}) not configured for updates`,
            }
        }
    }
}
