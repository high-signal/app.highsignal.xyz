import { NextResponse } from "next/server"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

// This function is used to backfill historical user total scores
export async function POST() {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    console.log("Updating historical user data")

    // Get every row in the user_signal_strengths table that has a value in value and is not a test_requesting_user
    const { data, error } = await supabase
        .from("user_signal_strengths")
        .select("*")
        .not("value", "is", null)
        .is("test_requesting_user", null)

    if (error) {
        console.error("Error fetching user signal strengths:", error.message)
        return NextResponse.json({ error: "Error fetching user signal strengths" }, { status: 500 })
    }

    // For each row, update the user_project_scores_history table
    for (const row of data) {
        await updateTotalScoreHistory(supabase, row.user_id, row.project_id, row.day)
    }

    return NextResponse.json({ message: "Historical user data updated" }, { status: 200 })
}

async function updateTotalScoreHistory(supabase: SupabaseClient, userId: string, projectId: string, day: string) {
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
        console.error(`Error updating user_project_scores_history for userId ${userId}:`, historyError.message)
    }
}

module.exports = {
    updateTotalScoreHistory,
}
