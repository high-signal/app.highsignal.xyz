const axios = require("axios")

async function fetchUserActivity(BASE_URL, username) {
    try {
        const url = `${BASE_URL}/u/${username}/activity.json`
        const response = await axios.get(url)

        if (!response.data || !Array.isArray(response.data)) {
            return []
        } else {
            return response.data.map((action) => ({
                id: action.id,
                cooked: action.cooked,
                updated_at: action.updated_at,
            }))
        }
    } catch (error) {
        console.error(`Error fetching activity for user ${username}:`, error.message)
        return null
    }
}

module.exports = { fetchUserActivity }
