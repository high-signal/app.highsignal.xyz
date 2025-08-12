async function getRawActivityCombinedData({
    supabase,
    userId,
    projectId,
    signalStrengthId,
    testingData,
    previousDays,
    dayDate,
}) {
    let query = supabase
        .from("user_signal_strengths")
        .select("*")
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .eq("signal_strength_id", signalStrengthId)
        .not("raw_value", "is", null)

    if (testingData.requestingUserId) {
        query = query.eq("test_requesting_user", testingData.requestingUserId)
    } else {
        query = query.is("test_requesting_user", null)
    }

    const formattedDayDate = new Date(`${dayDate}T23:59:59.999Z`)

    let rawActivityCombinedData =
        (
            await query
                .gte(
                    "day",
                    new Date(new Date(formattedDayDate).setDate(formattedDayDate.getDate() - previousDays))
                        .toISOString()
                        .split("T")[0],
                )
                .lte("day", dayDate)
                .order("day", { ascending: false })
        ).data || []

    rawActivityCombinedData = rawActivityCombinedData.map((item) => ({
        id: item.id,
        // summary: item.summary,
        description: item.description,
        // improvements: item.improvements,
        // explained_reasoning: item.explained_reasoning,
        raw_value: item.raw_value,
        max_value: item.max_value,
        day: item.day,
    }))

    // This is a catch for an edge case where duplicate raw score rows for the same day are created
    // It is important that raw scores and not double counted towards the smart score
    // In case there are any duplicates for the same day, keep the one with the larger id value
    const uniqueDays = [...new Set(rawActivityCombinedData.map((item) => item.day))]
    rawActivityCombinedData = uniqueDays.map((day) => {
        const itemsForDay = rawActivityCombinedData.filter((item) => item.day === day)
        return itemsForDay.reduce((max, current) => (current.id > max.id ? current : max))
    })

    // TODO: Add previous smart score (if it exists) to the end of the rawActivityCombinedData array so it can be
    // used as a reference for the analysis. Tell the smart prompt how to use it and to try not vary wildly unless
    // there is a good reason.

    return rawActivityCombinedData
}

module.exports = { getRawActivityCombinedData }
