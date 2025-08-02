async function fetchUserActivityFromDb({ supabase, projectId, userId }) {
    try {
        const { data: forumMessages, error: forumMessageError } = await supabase
            .from("forum_messages")
            .select("*")
            .eq("project_id", projectId)
            .eq("user_id", userId)

        if (forumMessageError) {
            console.error("Error fetching forum message:", forumMessageError)
            throw forumMessageError
        }
        const formattedActivity = forumMessages.map((message) => ({
            id: message.post_id,
            cooked: message.cooked,
            created_at: message.created_at,
        }))
        return formattedActivity
    } catch (error) {
        console.error(`⚠️ Error fetching activity for user ${username}:`, error.message)
        throw error
    }
}

module.exports = { fetchUserActivityFromDb }
