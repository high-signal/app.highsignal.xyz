async function fetchUserActivityFromDb({ supabase, projectId, userId, dayDate, previousDays }) {
    try {
        const formattedDayDate = new Date(`${dayDate}T23:59:59.999Z`)

        const { data: forumMessages, error: forumMessageError } = await supabase
            .from("forum_messages")
            .select("*")
            .eq("project_id", projectId)
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .gte(
                "created_at",
                new Date(new Date(formattedDayDate).setDate(formattedDayDate.getDate() - previousDays))
                    .toISOString()
                    .split("T")[0],
            )
            .lte("created_at", new Date(`${dayDate}T23:59:59.999Z`).toISOString())
            .limit(50)

        console.log("🔍 Forum messages:", forumMessages)

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
