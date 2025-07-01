async function getUsernames(supabase, projectId) {
    const { data, error } = await supabase
        .from("forum_users")
        .select("user_id, project_id, forum_username, last_updated")
        .eq("project_id", projectId)

    if (error) {
        console.error("Error fetching usernames from Supabase:", error.message)
        throw error
    }

    return data
}

module.exports = { getUsernames }
