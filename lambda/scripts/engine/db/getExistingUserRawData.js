async function getExistingUserRawData(supabase, userId, projectId, signalStrengthId, dailyActivityData) {
    // Create an array of all the days that have data in dailyActivityData
    const daysWithRawData = dailyActivityData.map((day) => day.date)

    // Fetch all the user_signal_strengths data for the days with data
    const { data: existingUserRawData, error: existingUserRawDataError } = await supabase
        .from("user_signal_strengths")
        .select("*")
        .in("day", daysWithRawData)
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .eq("signal_strength_id", signalStrengthId)
        .not("raw_value", "is", null)
        .is("test_requesting_user", null)

    if (existingUserRawDataError) {
        console.error("Error fetching existing user_signal_strengths data:", existingUserRawDataError)
        throw new Error("Error fetching existing user_signal_strengths data")
    }

    return existingUserRawData
}

module.exports = { getExistingUserRawData }
