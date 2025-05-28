// @ts-ignore
import { analyzeForumUserActivity } from "../../lambda/forumAnalysis/scripts/analyzeForumUserActivity"

export async function triggerForumAnalysis(
    user_id: string,
    project_id: string,
    signalStrengthUsername: string,
    testingData?: {
        requestingUserId: string
        testingInputData: {
            rawTestingInputData?: TestingInputData
            smartTestingInputData?: TestingInputData
        }
    },
) {
    const LAMBDA_ENDPOINT = process.env.LAMBDA_ENDPOINT_DISCOURSE_FORUM_ANALYSIS
    const API_KEY = process.env.LAMBDA_API_KEY

    if (LAMBDA_ENDPOINT) {
        // Execute on AWS Lambda
        try {
            // Don't await the response, just send the request
            fetch(LAMBDA_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": API_KEY || "",
                },
                body: JSON.stringify({
                    user_id,
                    project_id,
                    signalStrengthUsername,
                    async: true,
                    ...(testingData && { testingData }),
                }),
            })

            return {
                success: true,
                message: "Analysis initiated successfully",
                data: {
                    user_id,
                    project_id,
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
        analyzeForumUserActivity(user_id, project_id, signalStrengthUsername, testingData)
        return {
            success: true,
            message: "Analysis initiated successfully",
            data: {
                user_id,
                project_id,
                signalStrengthUsername,
                ...(testingData && { testingData }),
            },
        }
    }
}
