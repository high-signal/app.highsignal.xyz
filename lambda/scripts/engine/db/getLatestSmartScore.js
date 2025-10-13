async function getLatestSmartScore({ supabase, userId, projectId, signalStrengthId }) {
    const { data, error } = await supabase
        .from("user_signal_strengths")
        .select("*")
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .eq("signal_strength_id", signalStrengthId)
        .is("last_checked", null)
        .is("test_requesting_user", null)
        .not("value", "is", null)
        .order("day", { ascending: false })
        .limit(1)
    if (error) {
        console.error("Error fetching latest smart score from Supabase:", error.message)
        throw new Error(
            `Failed to fetch latest smart score for project ${projectId}, signal strength ${signalStrengthId}: ${error.message}`,
        )
    }
    return data
}

module.exports = { getLatestSmartScore }
