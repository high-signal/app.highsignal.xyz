import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Superadmin API to get admin stats
export async function GET() {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get missing days
    let missingDays = -1
    {
        const { count, error } = await supabase
            .from("user_signal_strengths_missing_ranges")
            .select("user_id, project_id, signal_strength_id, missing_day", { count: "exact" })
            .limit(0)

        if (error) {
            const errorMessage = "Error fetching missing days: " + (error.message || "Unknown error")
            console.error(errorMessage)
        } else {
            missingDays = count ?? 0
        }
    }

    // Get AI raw score errors
    let aiRawScoreErrors = -1
    {
        const { count, error } = await supabase
            .from("ai_request_queue")
            .select("id, status, type", { count: "exact" })
            .eq("status", "error")
            .eq("type", "raw_score")
            .limit(0)

        if (error) {
            const errorMessage = "Error fetching AI raw score errors: " + (error.message || "Unknown error")
            console.error(errorMessage)
        } else {
            aiRawScoreErrors = count ?? 0
        }
    }

    // Get last checked not null
    let lastCheckedNotNull = -1
    {
        const { count, error } = await supabase
            .from("user_signal_strengths")
            .select("id, last_checked", { count: "exact" })
            .not("last_checked", "is", null)
            .limit(0)

        if (error) {
            const errorMessage = "Error fetching last checked not null: " + (error.message || "Unknown error")
            console.error(errorMessage)
        } else {
            lastCheckedNotNull = count ?? 0
        }
    }

    // Get stale user project scores
    let staleUserProjectScores = -1
    {
        const { count, error } = await supabase
            .from("user_project_scores_stale_data")
            .select("user_id", { count: "exact" })
            .limit(0)

        if (error) {
            const errorMessage = "Error fetching stale user project scores: " + (error.message || "Unknown error")
            console.error(errorMessage)
        } else {
            staleUserProjectScores = count ?? 0
        }
    }

    // Get discord request queue errors
    let discordRequestQueueErrors = -1
    {
        const { count, error } = await supabase
            .from("discord_request_queue")
            .select("id, status", { count: "exact" })
            .eq("status", "error")
            .limit(0)

        if (error) {
            const errorMessage = "Error fetching discord request queue errors: " + (error.message || "Unknown error")
            console.error(errorMessage)
        } else {
            discordRequestQueueErrors = count ?? 0
        }
    }

    // Get duplicate user_signal_strengths rows
    let duplicateUserSignalStrengths = -1
    {
        const { count, error } = await supabase
            .from("user_signal_strengths_duplicates")
            .select("id", { count: "exact" })
            .limit(0)

        if (error) {
            const errorMessage =
                "Error fetching duplicate user signal strengths rows: " + (error.message || "Unknown error")
            console.error(errorMessage)
        } else {
            duplicateUserSignalStrengths = count ?? 0
        }
    }

    // Get lambda stats null billed duration
    let lambdaStatsNullBilledDuration = -1
    {
        const { count, error } = await supabase
            .from("lambda_stats")
            .select("request_id, billed_duration", { count: "exact" })
            .is("billed_duration", null)
            .limit(0)

        if (error) {
            const errorMessage =
                "Error fetching lambda stats null billed duration: " + (error.message || "Unknown error")
            console.error(errorMessage)
        } else {
            lambdaStatsNullBilledDuration = count ?? 0
        }
    }

    // Get rows from user_signal_strengths without raw_value or value
    // This is an edge case that I do not even think can happen anymore, but worth checking for
    // To fix:
    //      DELETE FROM user_signal_strengths
    //      WHERE value IS NULL
    //          AND raw_value IS NULL;
    let userSignalStrengthsWithoutRawValueOrValue = -1
    {
        const { count, error } = await supabase
            .from("user_signal_strengths")
            .select("id, raw_value, value", { count: "exact" })
            .is("raw_value", null)
            .is("value", null)
            .limit(0)

        if (error) {
            const errorMessage =
                "Error fetching user signal strengths without raw value or value: " + (error.message || "Unknown error")
            console.error(errorMessage)
        } else {
            userSignalStrengthsWithoutRawValueOrValue = count ?? 0
        }
    }

    return NextResponse.json({
        status: "success",
        statusCode: 200,
        data: {
            missingDays,
            aiRawScoreErrors,
            lastCheckedNotNull,
            staleUserProjectScores,
            discordRequestQueueErrors,
            duplicateUserSignalStrengths,
            lambdaStatsNullBilledDuration,
            userSignalStrengthsWithoutRawValueOrValue,
        },
    })
}
