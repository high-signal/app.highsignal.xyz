// @ts-ignore
import { handleAddAllItemsToAiQueue } from "../../lambda/scripts/index-handlers/handleAddAllItemsToAiQueue"
// @ts-ignore
import { handleAddSingleItemToAiQueue } from "../../lambda/scripts/index-handlers/handleAddSingleItemToAiQueue"

export async function triggerLambda(params: {
    functionType: string
    signalStrengthName?: string
    userId?: string
    projectId?: string
    signalStrengthUsername?: string
    testingData?: {
        requestingUserId: string
        testingInputData: {
            rawTestingInputData?: TestingInputData
            smartTestingInputData?: TestingInputData
        }
    }
}) {
    const { functionType, signalStrengthName, userId, projectId, signalStrengthUsername, testingData } = params
    const LAMBDA_FUNCTION_URL = process.env.LAMBDA_FUNCTION_URL
    const LAMBDA_API_KEY = process.env.LAMBDA_API_KEY

    // if (signalStrengthName != "discourse_forum" && signalStrengthName != "discord") {
    //     return {
    //         success: false,
    //         message: `Signal strength (${signalStrengthName}) not configured for updates`,
    //     }
    // }

    // Default to yesterday. Format: YYYY-MM-DD
    const dayDate = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]

    if (LAMBDA_FUNCTION_URL) {
        // Execute on AWS Lambda
        console.log("Executing on AWS Lambda")
        try {
            // Does not await the full response, just check that it starts successfully
            const response = await fetch(LAMBDA_FUNCTION_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": LAMBDA_API_KEY || "",
                },
                body: JSON.stringify({
                    functionType,
                    signalStrengthName,
                    userId,
                    projectId,
                    signalStrengthUsername,
                    dayDate,
                    ...(testingData && { testingData }),
                }),
            })

            if (response.status !== 202) {
                const errorBody = await response.text()
                throw new Error(`Lambda did not accept async trigger (status ${response.status}): ${errorBody}`)
            }

            return {
                success: true,
                message: "Analysis initiated successfully",
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

        try {
            // Do not await the full response, just check that it starts successfully
            if (functionType === "addAllItemsToAiQueue") {
                await handleAddAllItemsToAiQueue()
            } else if (functionType === "addSingleItemToAiQueue") {
                await handleAddSingleItemToAiQueue({
                    functionType,
                    signalStrengthName,
                    userId,
                    projectId,
                    signalStrengthUsername,
                    dayDate,
                    ...(testingData && { testingData }),
                })
            }
            return {
                success: true,
                message: "Analysis initiated successfully",
            }
        } catch (error) {
            console.error(`Error sending analysis request for ${signalStrengthName}:`, error)
            return {
                success: false,
                message: error instanceof Error ? error.message : "Failed to start analysis",
                error: error,
            }
        }
    }
}
