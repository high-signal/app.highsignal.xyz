const { updateTotalScoreHistory } = require("./updateTotalScoreHistory")

async function updateUserData({
    supabase,
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
        console.log(`Updating database for user ${signalStrengthUsername}`)

        // Store the analysis results in the user_signal_strengths table
        const { error: signalError } = await supabase.from("user_signal_strengths").insert({
            ...(!isRawScoreCalc && { value: analysisResults[signalStrengthUsername].value }),
            ...(isRawScoreCalc && { raw_value: analysisResults[signalStrengthUsername].value }),
            max_value: maxValue,
            summary: analysisResults[signalStrengthUsername].summary,
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
            temperature: analysisResults.temperature,
            prompt_id: analysisResults.promptId || null,
            max_chars: analysisResults.maxChars,
            day: dayDate,
        })

        if (signalError) {
            console.error(`Error storing signal strength for ${signalStrengthUsername}:`, signalError.message)
        } else {
            console.log(`Successfully stored signal strength response in database for ${signalStrengthUsername}`)
        }

        // Remove duplicate rows
        // Most likely to happen during a race condition where the same analysis is run twice at the same time
        const { error: deleteError, data } = await supabase
            .from("user_signal_strengths")
            .delete()
            .eq("user_id", userId)
            .eq("project_id", projectId)
            .eq("signal_strength_id", signalStrengthId)
            .eq("day", dayDate)
            .not("request_id", "eq", analysisResults.requestId) // Keep the one that was just inserted
            .not(isRawScoreCalc ? "raw_value" : "value", "is", null)
            .not(testingData?.requestingUserId ? "test_requesting_user" : "id", "is", null)
            .select()

        if (deleteError) {
            console.error(`Error deleting duplicate rows for ${signalStrengthUsername}:`, deleteError.message)
        } else if (data && data.length > 0) {
            console.log(`Successfully deleted ${data.length} duplicate rows for ${signalStrengthUsername}`)
        }

        // Update the user_project_scores_history table if it was a smart score calculation
        if (!isRawScoreCalc && !testingData?.requestingUserId) {
            await updateTotalScoreHistory(supabase, userId, projectId, dayDate)
        }
    } catch (dbError) {
        console.error(`Database error for ${signalStrengthUsername}:`, dbError.message)
    }
}

module.exports = { updateUserData }
