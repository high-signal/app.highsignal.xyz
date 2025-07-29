require("dotenv").config({ path: "../../../../.env" })

const { triggerAiQueueItem } = require("./triggerAiQueueItem")
const { selfInvokeAsynchronously } = require("../../utils/selfInvokeAsynchronously")

const LAMBDA_FUNCTION_URL = process.env.LAMBDA_FUNCTION_URL
const LAMBDA_API_KEY = process.env.LAMBDA_API_KEY

async function handleTriggerAiQueueItem({ queueItemId }) {
    const runningInLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME && !!process.env.AWS_REGION

    if (runningInLambda) {
        try {
            await selfInvokeAsynchronously({
                functionType: "runAiQueueItem",
                queueItemId,
            })

            return { started: true, invokedAs: "aws.lambda" }
        } catch (error) {
            console.error("Error self-invoking Lambda:", error)
            throw error
        }
    } else if (LAMBDA_API_KEY && LAMBDA_FUNCTION_URL) {
        // This is a fallback for local development when testing the lambda function directly
        try {
            const response = await fetch(LAMBDA_FUNCTION_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": LAMBDA_API_KEY,
                },
                body: JSON.stringify({
                    functionType: "runAiQueueItem",
                    queueItemId,
                }),
            })

            if (!response.ok) {
                throw new Error(`Lambda trigger failed: ${response.status}`)
            }

            return { started: true, invokedAs: "http" }
        } catch (error) {
            console.error("Error invoking Lambda via Function URL:", error)
            throw error
        }
    } else {
        // Running locally, call function directly
        await triggerAiQueueItem({ queueItemId })
        return { started: true, invokedAs: "direct-local" }
    }
}

module.exports = { handleTriggerAiQueueItem }
