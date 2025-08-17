async function getExistingUserRawData({
    supabase,
    userId,
    projectId,
    signalStrengthId,
    dailyActivityData,
    testingData,
}) {
    // Create an array of all the days that have data in dailyActivityData
    const daysWithRawData = dailyActivityData.map((day) => day.date)

    // Fetch all the user_signal_strengths data for the days with data
    let query = supabase
        .from("user_signal_strengths")
        .select("*")
        .in("day", daysWithRawData)
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .eq("signal_strength_id", signalStrengthId)
        .not("raw_value", "is", null)

    if (testingData?.requestingUserId) {
        query = query.eq("test_requesting_user", testingData.requestingUserId)
    } else {
        query = query.is("test_requesting_user", null)
    }

    const { data: existingUserRawData, error: existingUserRawDataError } = await query.order("id", { ascending: false })

    if (existingUserRawDataError) {
        console.error("Error fetching existing user_signal_strengths data:", existingUserRawDataError)
        throw new Error("Error fetching existing user_signal_strengths data")
    }

    // Filter out duplicate rows that have the same day, user_id, project_id, signal_strength_id
    // Note: It is unlikely that there will be duplicate rows, but it is possible so this is a safety check
    const uniqueRows = existingUserRawData.filter(
        (row, index, self) =>
            index ===
            self.findIndex(
                (t) =>
                    t.day === row.day &&
                    t.user_id === row.user_id &&
                    t.project_id === row.project_id &&
                    t.signal_strength_id === row.signal_strength_id,
            ),
    )

    return uniqueRows
}

module.exports = { getExistingUserRawData }
