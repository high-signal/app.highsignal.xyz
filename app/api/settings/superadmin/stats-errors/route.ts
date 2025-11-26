import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Superadmin API to get admin stats
export async function GET() {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const getCountWithTimeout = async (query: any, label: string, timeoutMs = 12000): Promise<number> => {
        let timeoutId: ReturnType<typeof setTimeout> | null = null

        const timeoutPromise = new Promise<number>((resolve) => {
            timeoutId = setTimeout(() => {
                console.error(`Timeout fetching ${label} after ${timeoutMs}ms`)
                resolve(-1)
            }, timeoutMs)
        })

        const queryPromise = query
            .then(({ count, error }: { count: number | null; error: any }) => {
                if (timeoutId) {
                    clearTimeout(timeoutId)
                }
                if (error) {
                    const errorMessage = `Error fetching ${label}: ${error.message || "Unknown error"}`
                    console.error(errorMessage)
                    return -1
                }
                return count ?? 0
            })
            .catch((error: any) => {
                if (timeoutId) {
                    clearTimeout(timeoutId)
                }
                const errorMessage = `Error fetching ${label}: ${error?.message || "Unknown error"}`
                console.error(errorMessage)
                return -1
            })

        return Promise.race([queryPromise, timeoutPromise])
    }

    const [
        missingDays,
        aiRawScoreErrors,
        lastCheckedNotNull,
        staleUserProjectScores,
        discordRequestQueueErrors,
        duplicateUserSignalStrengths,
        lambdaStatsNullBilledDuration,
        userSignalStrengthsWithoutRawValueOrValue,
    ] = await Promise.all([
        // Get missing days
        getCountWithTimeout(
            supabase
                .from("user_signal_strengths_missing_ranges")
                .select("user_id, project_id, signal_strength_id, missing_day", { count: "exact" })
                .limit(0),
            "missing days",
        ),
        // Get AI raw score errors
        getCountWithTimeout(
            supabase
                .from("ai_request_queue")
                .select("id, status, type", { count: "exact" })
                .eq("status", "error")
                .eq("type", "raw_score")
                .limit(0),
            "AI raw score errors",
        ),
        // Get last checked not null
        getCountWithTimeout(
            supabase
                .from("user_signal_strengths")
                .select("id, last_checked", { count: "exact" })
                .not("last_checked", "is", null)
                .limit(0),
            "last checked not null",
        ),
        // Get stale user project scores
        getCountWithTimeout(
            supabase.from("user_project_scores_stale_data").select("user_id", { count: "exact" }).limit(0),
            "stale user project scores",
        ),
        // Get discord request queue errors
        getCountWithTimeout(
            supabase
                .from("discord_request_queue")
                .select("id, status", { count: "exact" })
                .eq("status", "error")
                .limit(0),
            "discord request queue errors",
        ),
        // Get duplicate user_signal_strengths rows
        getCountWithTimeout(
            supabase.from("user_signal_strengths_duplicates").select("id", { count: "exact" }).limit(0),
            "duplicate user signal strengths rows",
        ),
        // Get lambda stats null billed duration
        getCountWithTimeout(
            supabase
                .from("lambda_stats")
                .select("request_id, billed_duration", { count: "exact" })
                .is("billed_duration", null)
                .limit(0),
            "lambda stats null billed duration",
        ),
        // Get rows from user_signal_strengths without raw_value or value
        // This is an edge case that I do not even think can happen anymore, but worth checking for
        // To fix:
        //      DELETE FROM user_signal_strengths
        //      WHERE value IS NULL
        //          AND raw_value IS NULL;
        getCountWithTimeout(
            supabase
                .from("user_signal_strengths")
                .select("id, raw_value, value", { count: "exact" })
                .is("raw_value", null)
                .is("value", null)
                .limit(0),
            "user signal strengths without raw value or value",
        ),
    ])

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
