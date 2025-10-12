// THIS FILE IS DEPRECATED
// The code was mode to a PostgreSQL function in the database/functions folder

const { updateTotalScoreHistory } = require("../db/updateTotalScoreHistory")

async function checkForSmartScoreGaps({ supabase }) {
    console.log("🔍 Checking for smart score gaps...")

    // Get the first batch of missing range rows
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayString = yesterday.toISOString().split("T")[0]

    const { data: ranges, error: rangeError } = await supabase
        .from("user_signal_strengths_missing_ranges")
        .select("*")
        .neq("gap_start_date", yesterdayString) // Exclude gaps starting yesterday
        .limit(100)

    if (rangeError) {
        console.error("🚨 Error fetching missing ranges:", rangeError)
        throw rangeError
    }

    if (!ranges?.length) {
        console.log("✅ No missing ranges found.")
        return
    }

    // Group by unique (user_id, project_id, signal_strength_id)
    const groups = {}
    for (const row of ranges) {
        const key = `${row.user_id}_${row.project_id}_${row.signal_strength_id}`
        if (!groups[key]) {
            groups[key] = {
                user_id: row.user_id,
                project_id: row.project_id,
                signal_strength_id: row.signal_strength_id,
                gaps: [],
            }
        }
        groups[key].gaps.push(row)
    }

    // Process each group
    for (const groupKey of Object.keys(groups)) {
        const { user_id, project_id, signal_strength_id, gaps } = groups[groupKey]
        // Local development logging
        if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
            console.log(
                `👀 Found ${gaps.length} gaps for user ${user_id}, project ${project_id}, signal ${signal_strength_id}`,
            )
        }

        for (const gap of gaps) {
            // Skip gaps starting yesterday (should never happen as it is excluded from the DB query)
            if (gap.gap_start_date === yesterdayString) {
                console.log(
                    `⚠️ Skipping gap starting yesterday for user ${user_id}, project ${project_id}, signal ${signal_strength_id}`,
                )
                continue
            }

            const gapValueDelta = gap.value_after - gap.value_before
            const gapMaxValueDelta = gap.max_value_after - gap.max_value_before
            const gapPreviousDaysDelta = gap.previous_days_after - gap.previous_days_before

            const totalDays = (new Date(gap.gap_end_date) - new Date(gap.gap_start_date)) / (1000 * 60 * 60 * 24) + 1

            const gapValueDeltaPerDay = Math.ceil(gapValueDelta / (totalDays + 1))
            const gapMaxValueDeltaPerDay = Math.ceil(gapMaxValueDelta / (totalDays + 1))
            const gapPreviousDaysDeltaPerDay = Math.ceil(gapPreviousDaysDelta / (totalDays + 1))

            const currentDate = new Date(gap.gap_start_date)

            // For each day in gap, add a new smart score row to user_signal_strengths table
            for (let i = 0; i < totalDays; i++) {
                const dateString = currentDate.toISOString().split("T")[0]

                try {
                    const { error: insertError } = await supabase.from("user_signal_strengths").insert({
                        user_id,
                        project_id,
                        signal_strength_id,
                        day: dateString,
                        request_id: `${user_id}_${project_id}_${signal_strength_id}_${dateString}_GAP_FILL`,
                        created: Math.floor(Date.now() / 1000),
                        summary: `Gap fill for ${dateString}`,
                        value: gap.value_before + gapValueDeltaPerDay * (i + 1),
                        max_value: gap.max_value_before + gapMaxValueDeltaPerDay * (i + 1),
                        previous_days: gap.previous_days_before + gapPreviousDaysDeltaPerDay * (i + 1),
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
                            console.error(`🚨 Insert failed for ${dateString}:`, insertError)
                            throw insertError
                        }
                    } else {
                        // Local development logging
                        if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
                            console.log(
                                `✅ Added smart score for ${dateString} (user ${user_id}, project ${project_id}, signal ${signal_strength_id})`,
                            )
                        }

                        // Update total score history
                        await updateTotalScoreHistory(supabase, user_id, project_id, dateString)
                    }
                } catch (err) {
                    console.error(
                        `🚨 Failed to process ${dateString} for user ${user_id}, project ${project_id}, signal ${signal_strength_id}:`,
                        err,
                    )
                }

                currentDate.setDate(currentDate.getDate() + 1)
            }
        }
    }

    console.log(`✅ Finished filling smart score gaps. ${Object.keys(groups).length} groups processed.`)
}

module.exports = { checkForSmartScoreGaps }
