import { Logger } from "winston"
import { DiscourseAdapterConfig } from "./config"
import { DiscourseUserActivity } from "./types"

/**
 * Fetches user activity data from the Discourse API using a signed request.
 *
 * @param username - The Discourse username.
 * @param config - The adapter configuration containing URL and signing keys.
 * @returns A promise that resolves to the user's activity data or null if an error occurs.
 */
export async function fetchUserActivity(
    username: string,
    config: DiscourseAdapterConfig,
): Promise<DiscourseUserActivity | null> {
    const { url: baseUrl } = config
    const url = `${baseUrl}/u/${username}/activity.json`

    console.log(`[DiscourseAdapter] Fetching user activity from: ${url}`)

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        })

        if (!response.ok) {
            const errorBody = await response.text()
            console.error(
                `[DiscourseAdapter] Failed to fetch user activity for ${username}. Status: ${response.status}, Body: ${errorBody}`,
            )
            return null
        }

        const actions = await response.json()

        if (!Array.isArray(actions)) {
            console.error(
                `[DiscourseAPI] Expected user activity response to be an array, but received type '${typeof actions}'.`,
                { response: actions },
            )
            // Return a valid structure with an empty array to prevent downstream errors
            return { user_actions: [] }
        }

        // The legacy system expects a raw array, but the new system uses a structured object.
        // We wrap the array to match the new system's expected type.
        return { user_actions: actions }
    } catch (error: any) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`[DiscourseAdapter] An error occurred while fetching user activity for ${username}.`, {
            error: error.message,
            stack: error.stack,
        })
        return null
    }
}
