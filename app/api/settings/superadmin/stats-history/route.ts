import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Superadmin API to get admin stats
export async function GET() {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const pastDays = 90

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

    // Get past X days of lambda stats
    const { data: lambdaStatsDaily, error: lambdaStatsDailyError } = await supabase
        .from("lambda_stats_daily")
        .select("*")
        .gte("day", new Date(Date.now() - pastDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0]) // keep only YYYY-MM-DD
        .order("day", { ascending: true })

    if (lambdaStatsDailyError) {
        const errorMessage = "Error fetching lambda stats daily: " + (lambdaStatsDailyError.message || "Unknown error")
        console.error(errorMessage)
        return NextResponse.json({ status: "error", statusCode: 500, error: errorMessage })
    }

    // Get past X days of AI stats
    const { data: aiStatsDaily, error: aiStatsDailyError } = await supabase
        .from("ai_stats_daily")
        .select("*")
        .gte("day", new Date(Date.now() - pastDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0]) // keep only YYYY-MM-DD
        .order("day", { ascending: true })

    if (aiStatsDailyError) {
        const errorMessage = "Error fetching ai stats daily: " + (aiStatsDailyError.message || "Unknown error")
        console.error(errorMessage)
        return NextResponse.json({ status: "error", statusCode: 500, error: errorMessage })
    }

    return NextResponse.json({
        status: "success",
        statusCode: 200,
        data: {
            lambdaStatsDaily,
            aiStatsDaily,
        },
    })
}
