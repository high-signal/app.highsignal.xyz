import { Logger } from "winston"
import { DiscourseAdapterRuntimeConfig } from "../../engine/src/config"
import { DiscourseUserActivity } from "./types"

/**
 * Fetches user activity data from the Discourse API.
 * @param username - The Discourse username.
 * @param config - The runtime configuration containing API URL and key.
 * @param logger - The logger instance for logging.
 * @returns A promise that resolves to the user's activity data or null if an error occurs.
 */
export async function fetchUserActivity(
    username: string,
    config: DiscourseAdapterRuntimeConfig,
    logger: Logger,
): Promise<DiscourseUserActivity | null> {
    const { API_URL, API_KEY } = config
    const url = `${API_URL}/users/${username}/activity.json`

    logger.info(`Fetching user activity for ${username} from ${url}`)

    try {
        const response = await fetch(url, {
            headers: {
                "Api-Key": API_KEY,
                "Api-Username": "system", // As per Discourse API docs for system-level calls
            },
        })

        if (!response.ok) {
            logger.error(`Failed to fetch activity for ${username}. Status: ${response.status} ${response.statusText}`)
            // Log response body if possible for more context
            const errorBody = await response.text()
            logger.error(`Error response body: ${errorBody}`)
            return null
        }

        return (await response.json()) as DiscourseUserActivity
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.error(`Exception occurred while fetching activity for ${username}: ${message}`, {
            error,
        })
        return null
    }
}
