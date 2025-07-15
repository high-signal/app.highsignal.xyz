async function getSignalStrengthConfig({ supabase, projectId, signalStrengthId }) {
    const { data, error } = await supabase
        .from("project_signal_strengths")
        .select("*")
        .eq("project_id", projectId)
        .eq("signal_strength_id", signalStrengthId)
        .single()
    if (error) {
        console.error("Error fetching signal strength config from Supabase:", error.message)
        throw new Error(
            `Failed to fetch signal strength config for project ${projectId}, signal strength ${signalStrengthId}: ${error.message}`,
        )
    }

    return data
}

module.exports = { getSignalStrengthConfig }
