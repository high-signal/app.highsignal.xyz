const { updateTotalScoreHistory } = require("./updateTotalScoreHistory")

async function updateUserData({
    supabase,
    type,
    projectId,
    signalStrengthId,
    signalStrengthUsername,
    userId,
    analysisResults,
    maxValue,
    testingData,
    isRawScoreCalc = false,
    dayDate,
}) {
    try {
        console.log(
            `💾 ${isRawScoreCalc ? "Raw" : "Smart"} score for ${signalStrengthUsername} on ${dayDate} updating database...`,
        )

        // Store the analysis results in the user_signal_strengths table
        const { error: signalError } = await supabase.from("user_signal_strengths").insert({
            ...(!isRawScoreCalc && { value: analysisResults[signalStrengthUsername].value }),
            ...(isRawScoreCalc && { raw_value: analysisResults[signalStrengthUsername].value }),
            max_value: maxValue,
            description: analysisResults[signalStrengthUsername].description,
            improvements: analysisResults[signalStrengthUsername].improvements,
            request_id: analysisResults.requestId,
            created: analysisResults.created,
            user_id: userId,
            project_id: projectId,
            signal_strength_id: signalStrengthId,
            explained_reasoning: analysisResults[signalStrengthUsername].explainedReasoning,
            prompt_tokens: analysisResults.promptTokens,
            completion_tokens: analysisResults.completionTokens,
            logs: analysisResults.logs,
            ...(testingData?.requestingUserId && { test_requesting_user: testingData.requestingUserId }),
            model: analysisResults.model,
            prompt_id: analysisResults.promptId || null,
            max_chars: analysisResults.maxChars,
            day: dayDate,
            previous_days: analysisResults.previousDays,
            analysis_items: analysisResults.analysisItems?.map((item) => item.id) || [],
        })

        if (signalError) {
            const errorMessage = `Error storing signal strength for ${signalStrengthUsername}: ${signalError.message}`
            console.error(errorMessage)
            throw new Error(errorMessage)
        }

        // ==========================
        // Race condition protection
        // ==========================
        // After saving the data, check the database for duplicate rows.
        // If there are any, delete all apart from the latest row `id`.
        // This means that if there is a race condition, the latest row will always remain.

        // Get all duplicate rows
        let query = supabase
            .from("user_signal_strengths")
            .select("id")
            .eq("user_id", userId)
            .eq("project_id", projectId)
            .eq("signal_strength_id", signalStrengthId)
            .eq("day", dayDate)
            .not(isRawScoreCalc ? "raw_value" : "value", "is", null)

        if (testingData?.requestingUserId) {
            query = query.eq("test_requesting_user", testingData.requestingUserId)
        }

        const { data: duplicateRows, error: duplicateError } = await query.order("id", { ascending: false })

        if (duplicateError) {
            const errorMessage = `Error getting duplicate rows for ${signalStrengthUsername}: ${duplicateError.message}`
            console.error(errorMessage)
            throw new Error(errorMessage)
        }

        if (duplicateRows && duplicateRows.length > 1) {
            // Delete all duplicate rows except the latest one (index 0)
            const rowsToDelete = duplicateRows.slice(1).map((row) => row.id)

            const { error: deleteError } = await supabase.from("user_signal_strengths").delete().in("id", rowsToDelete)

            if (deleteError) {
                const errorMessage = `Error deleting duplicate rows for ${signalStrengthUsername}: ${deleteError.message}`
                console.error(errorMessage)
                throw new Error(errorMessage)
            }
        }

        // Update the user_project_scores_history table if it was a smart score calculation
        if (!isRawScoreCalc && !testingData?.requestingUserId) {
            await updateTotalScoreHistory(supabase, userId, projectId, dayDate)
        }

        // Update materialized view for the user_project_scores table for smart score calculations for single_update
        if (!isRawScoreCalc && !testingData?.requestingUserId && type === "single_update") {
            const { error: refreshUserProjectScoresError } = await supabase.rpc("refresh_user_project_scores")

            if (refreshUserProjectScoresError) {
                const errorMessage = `❌ Failed to refresh user project scores: ${refreshUserProjectScoresError.message}`
                console.error(errorMessage)
                throw new Error(errorMessage)
            }
        }

        console.log(
            `💾 ${isRawScoreCalc ? "Raw" : "Smart"} score for ${signalStrengthUsername} on ${dayDate} saved to database.`,
        )
    } catch (dbError) {
        console.error(`Database error for ${signalStrengthUsername}:`, dbError.message)
        throw dbError
    }
}

module.exports = { updateUserData }
