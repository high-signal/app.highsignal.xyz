const { runEngine } = require("./scripts/engine/runEngine")

exports.handler = async (event) => {
    try {
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

        // Parse the request body
        console.log("Received event:", event)
        const raw = event.body ?? event
        const body = typeof raw === "string" ? JSON.parse(raw) : raw
        const { signalStrengthName, userId, projectId, signalStrengthUsername, testingData } = body

        // Validate required parameters
        if (!signalStrengthName || !userId || !projectId || !signalStrengthUsername) {
            console.log(
                `Missing required parameters: signalStrengthName: ${signalStrengthName}, userId: ${userId}, projectId: ${projectId}, signalStrengthUsername: ${signalStrengthUsername}`,
            )
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing required parameters" }),
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
    } catch (error) {
        console.error("Error in Lambda handler:", error)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error" }),
        }
    }
}
