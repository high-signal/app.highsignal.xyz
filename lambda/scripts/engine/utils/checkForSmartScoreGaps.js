const { updateTotalScoreHistory } = require("../db/updateTotalScoreHistory")

async function checkForSmartScoreGaps({ supabase, userId, projectId, signalStrengthId }) {
    console.log(
        `🔍 Checking for smart score gaps for userId ${userId}. Project: ${projectId}. Signal strength: ${signalStrengthId}`,
    )

    // Get all the matching gaps for this user, project, and signal strength
    const { data: gaps, error: gapsError } = await supabase
        .from("user_signal_strengths_missing_ranges")
        .select("*")
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .eq("signal_strength_id", signalStrengthId)

    if (gapsError) {
        console.error("🚨 Error fetching smart score gaps:", gapsError)
        throw gapsError
    }

    // Check to ensure that a gap fill never happens if there is a gap for yesterday
    if (gaps.length > 0) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayString = yesterday.toISOString().split("T")[0]
        const yesterdayGap = gaps.find((gap) => gap.gap_start_date === yesterdayString)
        if (yesterdayGap) {
            const errorMessage = `🚨 A gap fill cannot happen if there is a gap for yesterday. userId ${userId}. Project: ${projectId}. Signal strength: ${signalStrengthId}. Gap: ${yesterdayGap.gap_start_date} to ${yesterdayGap.gap_end_date}. This is an edge case that is unlikely to happen, but stops a gap summary being displayed to the users.`
            console.error(errorMessage)
            throw new Error(errorMessage)
        }

        // Helper function to generate date range
        function generateDateRange(startDate, endDate) {
            const dates = []
            const currentDate = new Date(startDate)
            const end = new Date(endDate)

            while (currentDate <= end) {
                dates.push(new Date(currentDate))
                currentDate.setDate(currentDate.getDate() + 1)
            }

            return dates
        }

        console.log(
            `👀 Found ${gaps.length} smart score gaps for userId ${userId}. Project: ${projectId}. Signal strength: ${signalStrengthId}`,
        )

        for (const gap of gaps) {
            console.log(
                `🏁 Processing gap for userId ${userId}. Project: ${projectId}. Signal strength: ${signalStrengthId}. Gap: ${gap.gap_start_date} to ${gap.gap_end_date}`,
            )

            // Generate date range for this gap (inclusive of start and end dates)
            const dateRange = generateDateRange(gap.gap_start_date, gap.gap_end_date)

            const gapValueDelta = gap.value_after - gap.value_before
            const gapValueDeltaPerDay = Math.ceil(gapValueDelta / (dateRange.length + 1))

            const gapMaxValueDelta = gap.max_value_after - gap.max_value_before
            const gapMaxValueDeltaPerDay = Math.ceil(gapMaxValueDelta / (dateRange.length + 1))

            const gapPreviousDaysDelta = gap.previous_days_after - gap.previous_days_before
            const gapPreviousDaysDeltaPerDay = Math.ceil(gapPreviousDaysDelta / (dateRange.length + 1))

            // For each day in gap, add a new smart score row to user_signal_strengths table
            for (let index = 0; index < dateRange.length; index++) {
                const date = dateRange[index]
                const dateString = date.toISOString().split("T")[0] // Format as YYYY-MM-DD

                try {
                    // Insert smart score row for this date
                    const { error: insertError } = await supabase.from("user_signal_strengths").insert({
                        user_id: gap.user_id,
                        project_id: gap.project_id,
                        signal_strength_id: gap.signal_strength_id,
                        day: dateString,
                        request_id: `${userId}_${projectId}_${signalStrengthId}_${dateString}_GAP_FILL`,
                        created: Math.floor(Date.now() / 1000),
                        summary: `Gap fill for ${dateString}`,
                        value: gap.value_before + gapValueDeltaPerDay * (index + 1),
                        max_value: gap.max_value_before + gapMaxValueDeltaPerDay * (index + 1),
                        previous_days: gap.previous_days_before + gapPreviousDaysDeltaPerDay * (index + 1),
                    })

                    if (insertError) {
                        // Check if this is a duplicate row error (unique constraint violation)
                        if (
                            insertError.code === "23505" ||
                            insertError.message?.includes("duplicate key") ||
                            insertError.message?.includes("already exists")
                        ) {
                            console.log(`ℹ️ Smart score for ${dateString} already exists, skipping...`)
                        } else {
                            console.error(`🚨 Error inserting smart score for ${dateString}:`, insertError)
                            throw insertError
                        }
                    }

                    console.log(
                        `✅ Added smart score for ${dateString} for userId ${userId}. Project: ${projectId}. Signal strength: ${signalStrengthId}`,
                    )

                    // Update the user_project_scores_history table if it was a smart score calculation
                    await updateTotalScoreHistory(supabase, userId, projectId, dateString)
                } catch (error) {
                    console.error(
                        `🚨 Failed to process date ${dateString} for userId ${userId}. Project: ${projectId}. Signal strength: ${signalStrengthId}:`,
                        error,
                    )
                    throw error
                }
            }
        }
    }
}

module.exports = { checkForSmartScoreGaps }
