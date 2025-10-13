import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Superadmin API to get admin stats
export async function GET() {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get missing days
    const { count: missingDays, error: missingDaysError } = await supabase
        .from("user_signal_strengths_missing_ranges")
        .select("*", { count: "exact" })
        .limit(0)

    if (missingDaysError) {
        const errorMessage = "Error fetching missing days: " + (missingDaysError.message || "Unknown error")
        console.error(errorMessage)
        return NextResponse.json({ status: "error", statusCode: 500, error: errorMessage })
    }

    // Get AI raw score errors
    const { count: aiRawScoreErrors, error: aiRawScoreErrorsError } = await supabase
        .from("ai_request_queue")
        .select("*", { count: "exact" })
        .eq("status", "error")
        .eq("type", "raw_score")
        .limit(0)

    if (aiRawScoreErrorsError) {
        const errorMessage = "Error fetching AI raw score errors: " + (aiRawScoreErrorsError.message || "Unknown error")
        console.error(errorMessage)
        return NextResponse.json({ status: "error", statusCode: 500, error: errorMessage })
    }

    // Get last checked not null
    const { count: lastCheckedNotNull, error: lastCheckedNotNullError } = await supabase
        .from("user_signal_strengths")
        .select("*", { count: "exact" })
        .not("last_checked", "is", null)
        .limit(0)

    if (lastCheckedNotNullError) {
        const errorMessage =
            "Error fetching last checked not null: " + (lastCheckedNotNullError.message || "Unknown error")
        console.error(errorMessage)
        return NextResponse.json({ status: "error", statusCode: 500, error: errorMessage })
    }

    // Get discord request queue errors
    const { count: discordRequestQueueErrors, error: discordRequestQueueErrorsError } = await supabase
        .from("discord_request_queue")
        .select("*", { count: "exact" })
        .eq("status", "error")
        .limit(0)

    if (discordRequestQueueErrorsError) {
        const errorMessage =
            "Error fetching discord request queue errors: " +
            (discordRequestQueueErrorsError.message || "Unknown error")
        console.error(errorMessage)
        return NextResponse.json({ status: "error", statusCode: 500, error: errorMessage })
    }

    // Get lambda stats null billed duration
    const { count: lambdaStatsNullBilledDuration, error: lambdaStatsNullBilledDurationError } = await supabase
        .from("lambda_stats")
        .select("*", { count: "exact" })
        .is("billed_duration", null)
        .limit(0)

    if (lambdaStatsNullBilledDurationError) {
        const errorMessage =
            "Error fetching lambda stats null billed duration: " +
            (lambdaStatsNullBilledDurationError.message || "Unknown error")
        console.error(errorMessage)
        return NextResponse.json({ status: "error", statusCode: 500, error: errorMessage })
    }

    // Get rows from user_signal_strengths without raw_value or value
    // This is an edge case that I do not even think can happen anymore, but worth checking for
    // To fix:
    //      DELETE FROM user_signal_strengths
    //      WHERE value IS NULL
    //          AND raw_value IS NULL;
    const { count: userSignalStrengthsWithoutRawValueOrValue, error: userSignalStrengthsWithoutRawValueOrValueError } =
        await supabase
            .from("user_signal_strengths")
            .select("*", { count: "exact" })
            .is("raw_value", null)
            .is("value", null)
            .limit(0)

    if (userSignalStrengthsWithoutRawValueOrValueError) {
        const errorMessage =
            "Error fetching user signal strengths without raw value or value: " +
            (userSignalStrengthsWithoutRawValueOrValueError.message || "Unknown error")
        console.error(errorMessage)
        return NextResponse.json({ status: "error", statusCode: 500, error: errorMessage })
    }

    return NextResponse.json({
        status: "success",
        statusCode: 200,
        data: {
            missingDays,
            aiRawScoreErrors,
            lastCheckedNotNull,
            discordRequestQueueErrors,
            lambdaStatsNullBilledDuration,
            userSignalStrengthsWithoutRawValueOrValue,
        },
    })
}
