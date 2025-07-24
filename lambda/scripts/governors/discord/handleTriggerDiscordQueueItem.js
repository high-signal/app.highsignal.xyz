require("dotenv").config({ path: "../../../../.env" })

const { triggerDiscordQueueItem } = require("./triggerDiscordQueueItem")

const LAMBDA_FUNCTION_URL = process.env.LAMBDA_FUNCTION_URL
const LAMBDA_API_KEY = process.env.LAMBDA_API_KEY

async function handleTriggerDiscordQueueItem({ queueItemId }) {
    if (LAMBDA_API_KEY && LAMBDA_FUNCTION_URL) {
        // Running in Lambda context, call another Lambda
        try {
            const response = await fetch(LAMBDA_FUNCTION_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": LAMBDA_API_KEY,
                },
                body: JSON.stringify({
                    functionType: "runDiscordQueueItem",
                    queueItemId,
                    async: true,
                }),
            })
            if (!response.ok) {
                throw new Error(`Lambda trigger failed: ${response.status}`)
            }
            return { started: true, status: response.status }
        } catch (error) {
            console.error("Error invoking Lambda:", error)
            throw error
        }
    } else {
        // Running locally, call function directly
        return await triggerDiscordQueueItem({ queueItemId })
    }
}

module.exports = { handleTriggerDiscordQueueItem }
