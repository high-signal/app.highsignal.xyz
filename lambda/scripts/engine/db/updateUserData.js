const { updateTotalScoreHistory } = require("./updateTotalScoreHistory")

async function updateUserData(
    supabase,
    PROJECT_ID,
    SIGNAL_STRENGTH_ID,
    username,
    userId,
    analysisResults,
    maxValue,
    testingData,
    isRawScoreCalc = false,
    dayDate,
) {
    try {
        console.log(`Updating database for user ${username}`)

        // Store the analysis results in the user_signal_strengths table
        const { error: signalError } = await supabase.from("user_signal_strengths").insert({
            ...(!isRawScoreCalc && { value: analysisResults[username].value }),
            ...(isRawScoreCalc && { raw_value: analysisResults[username].value }),
            max_value: maxValue,
            summary: analysisResults[username].summary,
            description: analysisResults[username].description,
            improvements: analysisResults[username].improvements,
            request_id: analysisResults.requestId,
            created: analysisResults.created,
            user_id: userId,
            project_id: PROJECT_ID,
            signal_strength_id: SIGNAL_STRENGTH_ID,
            explained_reasoning: analysisResults[username].explainedReasoning,
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
            console.error(`Error storing signal strength for ${username}:`, signalError.message)
        } else {
            console.log(`Successfully stored signal strength response in database for ${username}`)
        }

        // Remove duplicate rows
        // Most likely to happen during a race condition where the same analysis is run twice at the same time
        const { error: deleteError, data } = await supabase
            .from("user_signal_strengths")
            .delete()
            .eq("user_id", userId)
            .eq("project_id", PROJECT_ID)
            .eq("signal_strength_id", SIGNAL_STRENGTH_ID)
            .eq("day", dayDate)
            .not("request_id", "eq", analysisResults.requestId) // Keep the one that was just inserted
            .not(isRawScoreCalc ? "raw_value" : "value", "is", null)
            .not(testingData?.requestingUserId ? "test_requesting_user" : "id", "is", null)
            .select()

        if (deleteError) {
            console.error(`Error deleting duplicate rows for ${username}:`, deleteError.message)
        } else if (data && data.length > 0) {
            console.log(`Successfully deleted ${data.length} duplicate rows for ${username}`)
        }

        // Update the user_project_scores_history table if it was a smart score calculation
        if (!isRawScoreCalc && !testingData?.requestingUserId) {
            await updateTotalScoreHistory(supabase, userId, PROJECT_ID, dayDate)
        }
    } catch (dbError) {
        console.error(`Database error for ${username}:`, dbError.message)
    }
}

module.exports = { updateUserData }
