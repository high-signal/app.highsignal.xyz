async function getUserDisplayName(supabase, userId) {
    const { data, error } = await supabase.from("users").select("display_name").eq("id", userId).single()
    if (error) {
        console.error("Error fetching user display name from Supabase:", error.message)
        throw new Error(`Failed to fetch user display name for user ${userId}: ${error.message}`)
    }
    return data.display_name
}

module.exports = { getUserDisplayName }
