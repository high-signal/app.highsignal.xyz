const axios = require("axios")
const { processObjectForHtml } = require("../../engine/utils/processObjectForHtml")

const { MAX_ACTIVITY_CHAR_LIMIT } = require("./constants")

async function fetchUserActivity({ pendingQueueItem, projectSignalStrengthConfig }) {
    const BASE_URL = projectSignalStrengthConfig.url
    const username = pendingQueueItem.forum_username
    const fullUrl = `${BASE_URL}/u/${username}/activity.json`

    let forumActivity = []
    let errorFetchingUserActivity = null

    try {
        const response = await axios.get(fullUrl)

        if (!response.data || !Array.isArray(response.data)) {
            console.log(`📭 No activity data found for user ${username}`)
        } else {
            forumActivity = response.data.map((action) => ({
                id: action.id,
                cooked: processObjectForHtml(action.cooked).substring(0, MAX_ACTIVITY_CHAR_LIMIT),
                created_at: action.created_at,
            }))
        }
    } catch (error) {
        console.error(`⚠️ Error fetching forum activity from ${fullUrl}: ${error.message}`)
        errorFetchingUserActivity = true
    }

    return { forumActivity, errorFetchingUserActivity }
}

module.exports = { fetchUserActivity }
