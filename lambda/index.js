const { runEngine } = require("./scripts/engine/runEngine")
const { runDiscordGovernor } = require("./scripts/governors/discordGovernor")

exports.handler = async (event) => {
    try {
        if (event.headers) {
            // Check API key
            const apiKey = event.headers?.["x-api-key"] || event.headers?.["X-API-Key"]
            const expectedApiKey = process.env.LAMBDA_API_KEY

            if (!apiKey || apiKey !== expectedApiKey) {
                console.log(`Unauthorized: Invalid API key`)
                return {
                    statusCode: 401,
                    body: JSON.stringify({ error: "Unauthorized: Invalid API key" }),
                }
            }
        } else if (event.source === "aws.events") {
            // Triggered directly from AWS EventBridge
            console.log("Received scheduled event")
        } else {
            console.warn("Unauthorized or unknown source")
            console.log("event.source", event.source)
            return {
                statusCode: 403,
                body: JSON.stringify({ error: "Forbidden: Unknown source" }),
            }
        }

        // Parse the request body
        console.log("Received event:", event)
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
            case "runEngine":
                return await handleRunEngine(functionParams)
            case "runDiscordGovernor":
                return await handleRunDiscordGovernor()
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

async function handleRunEngine(params) {
    const { signalStrengthName, userId, projectId, signalStrengthUsername, testingData } = params

    // Validate required parameters for runEngine
    if (!signalStrengthName || !userId || !projectId || !signalStrengthUsername) {
        console.log(
            `Missing required parameters for runEngine: signalStrengthName: ${signalStrengthName}, userId: ${userId}, projectId: ${projectId}, signalStrengthUsername: ${signalStrengthUsername}`,
        )
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing required parameters for runEngine" }),
        }
    }

    // Process the request based on the signal strength name
    if (signalStrengthName === "discourse_forum" /* || signalStrengthName === "discord"*/) {
        await runEngine({
            signalStrengthName,
            userId,
            projectId,
            signalStrengthUsername,
            testingData,
        })
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Analysis completed successfully" }),
        }
    } else {
        console.log(`Signal strength (${signalStrengthName}) not configured for updates`)
        return {
            statusCode: 400,
            body: JSON.stringify({ error: `Signal strength (${signalStrengthName}) not configured for updates` }),
        }
    }
}

async function handleRunDiscordGovernor() {
    try {
        await runDiscordGovernor()
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Discord Governor completed successfully" }),
        }
    } catch (error) {
        console.error("Error in runDiscordGovernor:", error)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error running governor" }),
        }
    }
}
