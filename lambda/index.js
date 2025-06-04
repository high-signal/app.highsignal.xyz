const { analyzeForumUserActivity } = require("./scripts/discourse-forum/analyzeForumUserActivity")

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
        const { signalStrengthName, user_id, project_id, signalStrengthUsername, testingData } = body

        // Validate required parameters
        if (!signalStrengthName || !user_id || !project_id || !signalStrengthUsername) {
            console.log(
                `Missing required parameters: signalStrengthName: ${signalStrengthName}, user_id: ${user_id}, project_id: ${project_id}, signalStrengthUsername: ${signalStrengthUsername}`,
            )
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing required parameters" }),
            }
        }

        // Process the request based on the signal strength name
        if (signalStrengthName === "discourse_forum") {
            await analyzeForumUserActivity(user_id, project_id, signalStrengthUsername, testingData)
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
