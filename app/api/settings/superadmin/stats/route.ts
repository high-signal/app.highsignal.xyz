import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Superadmin API to get admin stats
export async function GET() {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get the total number of users
    const { count: totalUsers, error: usersError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })

    if (usersError) {
        const errorMessage = "Error fetching all users: " + (usersError.message || "Unknown error")
        console.error(errorMessage)
        return NextResponse.json({ status: "error", statusCode: 500, error: errorMessage })
    }

    // Get total number of active users
    const { count: activeUsers, error: activeUsersError } = await supabase
        .from("user_project_scores")
        .select("*", { count: "exact", head: true })
        .gt("total_score", 0)

    if (activeUsersError) {
        const errorMessage = "Error fetching active users: " + (activeUsersError.message || "Unknown error")
        console.error(errorMessage)
        return NextResponse.json({ status: "error", statusCode: 500, error: errorMessage })
    }

    // Get missing days
    const { count: missingDays, error: missingDaysError } = await supabase
        .from("user_signal_strengths_missing_ranges")
        .select("*", { count: "exact", head: true })

    if (missingDaysError) {
        const errorMessage = "Error fetching missing days: " + (missingDaysError.message || "Unknown error")
        console.error(errorMessage)
        return NextResponse.json({ status: "error", statusCode: 500, error: errorMessage })
    }

    // Get AI raw score errors
    const { count: aiRawScoreErrors, error: aiRawScoreErrorsError } = await supabase
        .from("ai_request_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "error")
        .eq("type", "raw_score")

    if (aiRawScoreErrorsError) {
        const errorMessage = "Error fetching AI raw score errors: " + (aiRawScoreErrorsError.message || "Unknown error")
        console.error(errorMessage)
        return NextResponse.json({ status: "error", statusCode: 500, error: errorMessage })
    }

    // Get last checked not null
    const { count: lastCheckedNotNull, error: lastCheckedNotNullError } = await supabase
        .from("user_signal_strengths")
        .select("*", { count: "exact", head: true })
        .not("last_checked", "is", null)

    if (lastCheckedNotNullError) {
        const errorMessage =
            "Error fetching last checked not null: " + (lastCheckedNotNullError.message || "Unknown error")
        console.error(errorMessage)
        return NextResponse.json({ status: "error", statusCode: 500, error: errorMessage })
    }

    // Get discord request queue errors
    const { count: discordRequestQueueErrors, error: discordRequestQueueErrorsError } = await supabase
        .from("discord_request_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "error")

    if (discordRequestQueueErrorsError) {
        const errorMessage =
            "Error fetching discord request queue errors: " +
            (discordRequestQueueErrorsError.message || "Unknown error")
        console.error(errorMessage)
        return NextResponse.json({ status: "error", statusCode: 500, error: errorMessage })
    }

    return NextResponse.json({
        status: "success",
        statusCode: 200,
        data: {
            totalUsers,
            activeUsers,
            missingDays,
            aiRawScoreErrors,
            lastCheckedNotNull,
            discordRequestQueueErrors,
        },
    })
}
