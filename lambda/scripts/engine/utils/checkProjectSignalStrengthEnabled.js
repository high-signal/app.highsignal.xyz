async function checkProjectSignalStrengthEnabled({ supabase, projectId, signalStrengthId }) {
    const { data: projectSignalData, error: projectSignalError } = await supabase
        .from("project_signal_strengths")
        .select(
            `
                enabled,
                projects (
                    display_name
                )
            `,
        )
        .eq("project_id", projectId)
        .eq("signal_strength_id", signalStrengthId)
        .single()

    if (projectSignalError || !projectSignalData || !projectSignalData.enabled) {
        return false
    }

    return true
}

module.exports = { checkProjectSignalStrengthEnabled }
