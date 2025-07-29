async function getSignalStrengthData({ supabase, signalStrengthId }) {
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
        .eq("id", signalStrengthId)
        .single()

    if (signalStrengthDataError) {
        console.error(
            `Error fetching signal strength data for signalStrengthId: ${signalStrengthId}:`,
            signalStrengthDataError,
        )
        throw signalStrengthDataError
    }

    return signalStrengthData
}

module.exports = { getSignalStrengthData }
