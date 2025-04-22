// @ts-ignore
import { analyzeForumUserActivity } from "../../lambda/forumAnalysis/scripts/analyzeForumUserActivity"

export async function triggerForumAnalysis(user_id: string, project_id: string, forum_username: string) {
    const LAMBDA_ENDPOINT = process.env.LAMBDA_ENDPOINT_DISCOURSE_FORUM_ANALYSIS

    if (LAMBDA_ENDPOINT) {
        // Execute on AWS Lambda
        try {
            const response = await fetch(LAMBDA_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id,
                    project_id,
                    forum_username,
                }),
            })

            if (!response.ok) {
                throw new Error(`Lambda execution failed with status: ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error("Error executing forum analysis on Lambda:", error)
            throw error
        }
    } else {
        // Execute locally
        return analyzeForumUserActivity(user_id, project_id, forum_username)
    }
}
