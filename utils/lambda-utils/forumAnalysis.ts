// @ts-ignore
import { analyzeForumUserActivity } from "../../lambda/forumAnalysis/scripts/analyzeForumUserActivity"

export async function triggerForumAnalysis(user_id: string, project_id: string, forum_username: string) {
    const LAMBDA_ENDPOINT = process.env.LAMBDA_ENDPOINT_DISCOURSE_FORUM_ANALYSIS
    const API_KEY = process.env.LAMBDA_API_KEY

    if (LAMBDA_ENDPOINT) {
        // Execute on AWS Lambda
        try {
            const response = await fetch(LAMBDA_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": API_KEY || "",
                },
                body: JSON.stringify({
                    user_id,
                    project_id,
                    forum_username,
                    async: true,
                }),
            })

            console.log("Lambda response:", response)

            return {
                success: true,
                message: "Analysis initiated successfully",
                data: {
                    user_id,
                    project_id,
                    forum_username,
                },
            }
        } catch (error) {
            console.error("Error executing forum analysis on Lambda:", error)
            return {
                success: false,
                message: error instanceof Error ? error.message : "Failed to start analysis",
                error: error,
            }
        }
    } else {
        // Execute locally
        analyzeForumUserActivity(user_id, project_id, forum_username)
        return {
            success: true,
            message: "Analysis initiated successfully",
            data: {
                user_id,
                project_id,
                forum_username,
            },
        }
    }
}
