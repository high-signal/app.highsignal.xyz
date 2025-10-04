import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Superadmin API to get admin stats
export async function GET() {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const pastDays = 2

    // Get past X days of lambda stats
    const { data: lambdaStatsDaily, error: lambdaStatsDailyError } = await supabase
        .from("ai_stats_daily")
        .select("*")
        .gte("day", new Date(Date.now() - pastDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0]) // keep only YYYY-MM-DD
        .order("day", { ascending: false })

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
        .order("day", { ascending: false })

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
