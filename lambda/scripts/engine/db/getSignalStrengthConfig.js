async function getSignalStrengthConfig(supabase, PROJECT_ID, SIGNAL_STRENGTH_ID) {
    const { data, error } = await supabase
        .from("project_signal_strengths")
        .select("*")
        .eq("project_id", PROJECT_ID)
        .eq("signal_strength_id", SIGNAL_STRENGTH_ID)
        .single()
    if (error) {
        console.error("Error fetching signal strength config from Supabase:", error.message)
        throw new Error(
            `Failed to fetch signal strength config for project ${PROJECT_ID}, signal strength ${SIGNAL_STRENGTH_ID}: ${error.message}`,
        )
    }

    return data
}

module.exports = { getSignalStrengthConfig }
