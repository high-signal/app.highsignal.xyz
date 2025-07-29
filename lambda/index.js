const { handleAddAllItemsToAiQueue } = require("./scripts/index-handlers/handleAddAllItemsToAiQueue")
const { handleAddSingleItemToAiQueue } = require("./scripts/index-handlers/handleAddSingleItemToAiQueue")
const { handleRunAiGovernor } = require("./scripts/index-handlers/handleRunAiGovernor")
const { handleRunAiQueueItem } = require("./scripts/index-handlers/handleRunAiQueueItem")
const { handleRunDiscordGovernor } = require("./scripts/index-handlers/handleRunDiscordGovernor")
const { handleRunDiscordQueueItem } = require("./scripts/index-handlers/handleRunDiscordQueueItem")

const { selfInvokeAsynchronously } = require("./scripts/utils/selfInvokeAsynchronously")

exports.handler = async (event) => {
    try {
        if (event.headers) {
            const apiKey = event.headers?.["x-api-key"] || event.headers?.["X-API-Key"]
            const expectedApiKey = process.env.LAMBDA_API_KEY

            // Check if the api key is valid
            if (!apiKey || apiKey !== expectedApiKey) {
                console.log(`Unauthorized: Invalid API key`)
                return {
                    statusCode: 401,
                    body: JSON.stringify({ error: "Unauthorized: Invalid API key" }),
                }
            }

            // If the http request is authorized, re-invoke lambda asynchronously and return 202
            console.log("↪️ Received external HTTP request. Re-invoking lambda asynchronously...")
            await selfInvokeAsynchronously(event.body ?? event)

            // This is the immediate response to the http request to acknowledge
            // that the work has been scheduled asynchronously
            return {
                statusCode: 202,
                body: JSON.stringify({ message: "Accepted. Work triggered asynchronously." }),
            }
        } else if (event.source === "aws.events") {
            // Triggered directly from AWS EventBridge
        } else if (event.source === "aws.lambda") {
            // Triggered directly from AWS Lambda
        } else {
            console.warn("Unauthorized or unknown source")
            console.log("event.source", event.source)
            return {
                statusCode: 403,
                body: JSON.stringify({ error: "Forbidden: Unknown source" }),
            }
        }

        // Parse the request body
        console.log("🎟️ Received event:", event)
        const raw = event.body ?? event
        const body = typeof raw === "string" ? JSON.parse(raw) : raw

        // Extract function type from the request
        const { functionType, ...functionParams } = body

        // Validate function type
        if (!functionType) {
            console.log("Missing required parameter: function")
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing required parameter: function" }),
            }
        }

        // Route to appropriate function based on function type
        switch (functionType) {
            case "addAllItemsToAiQueue":
                return await handleAddAllItemsToAiQueue()
            case "addSingleItemToAiQueue":
                return await handleAddSingleItemToAiQueue(functionParams)
            case "runAiGovernor": // Processes the AI queue
                return await handleRunAiGovernor()
            case "runAiQueueItem": // Processes a single item from the AI queue
                return await handleRunAiQueueItem(functionParams)
            case "runDiscordGovernor": // Processes the Discord queue
                return await handleRunDiscordGovernor()
            case "runDiscordQueueItem": // Processes a single item from the Discord queue
                return await handleRunDiscordQueueItem(functionParams)
            default:
                console.log(`Unknown function type: ${functionType}`)
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: `Unknown function type: ${functionType}` }),
                }
        }
    } catch (error) {
        console.error("Error in Lambda handler:", error)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error" }),
        }
    }
}
