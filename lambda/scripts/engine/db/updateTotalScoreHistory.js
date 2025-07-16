async function updateTotalScoreHistory(supabase, userId, projectId, day) {
    // Get all the signal strength smart scores for the user, project and day
    const { data: signalStrengthScores, error: signalStrengthScoresError } = await supabase
        .from("user_signal_strengths")
        .select("value")
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .eq("day", day)
        .not("value", "is", null)
        .is("test_requesting_user", null)

    if (signalStrengthScoresError) {
        console.error("Error fetching signal strength scores:", signalStrengthScoresError.message)
        return
    }

    // Calculate the total score
    const totalScore = signalStrengthScores.reduce((acc, curr) => acc + curr.value, 0)

    // Update the user_project_scores_history table
    const { error: historyError } = await supabase.from("user_project_scores_history").upsert(
        {
            user_id: userId,
            project_id: projectId,
            total_score: totalScore,
            day: day,
        },
        { onConflict: "user_id,project_id,day" },
    )

    if (historyError) {
        console.error(
            `Error updating user_project_scores_history for userId: ${userId} for day: ${day}:`,
            historyError.message,
        )
    } else {
        console.log(`💾 Successfully updated user_project_scores_history for: userId ${userId} for day ${day}`)
    }
}

module.exports = {
    updateTotalScoreHistory,
}
