const { analyzeForumUserActivity } = require("./scripts/analyzeForumUserActivity")

// Test lambda redeploy

exports.handler = async (event) => {
    try {
        // Check API key
        const apiKey = event.headers?.["x-api-key"] || event.headers?.["X-API-Key"]
        const expectedApiKey = process.env.LAMBDA_API_KEY

        if (!apiKey || apiKey !== expectedApiKey) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: "Unauthorized: Invalid API key" }),
            }
        }

        console.log("Received event:", event)
        const raw = event.body ?? event
        const body = typeof raw === "string" ? JSON.parse(raw) : raw
        const { user_id, project_id, forum_username, testingData } = body

        if (!user_id || !project_id || !forum_username) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing required parameters" }),
            }
        }

        await analyzeForumUserActivity(user_id, project_id, forum_username, testingData)

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Analysis completed successfully" }),
        }
    } catch (error) {
        console.error("Error in Lambda handler:", error)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error" }),
        }
    }
}
