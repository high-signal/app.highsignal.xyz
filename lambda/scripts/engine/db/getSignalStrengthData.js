async function getSignalStrengthData(supabase, signalStrengthName) {
    // Returns all prompts for the signal strength
    // Prompt filtering for each type and date is carried out for each analysis
    const { data: signalStrengthData, error: signalStrengthDataError } = await supabase
        .from("signal_strengths")
        .select(
            `
                *,
                prompts (
                    *
                )
            `,
        )
        .eq("name", signalStrengthName)
        .single()

    if (signalStrengthDataError) {
        console.error(`Error fetching signal strength ID for ${signalStrengthName}:`, signalStrengthDataError)
        return
    }

    return signalStrengthData
}

module.exports = { getSignalStrengthData }
