async function updateUserData(
    supabase,
    PROJECT_ID,
    SIGNAL_STRENGTH_ID,
    username,
    user,
    latestActivityDate,
    analysisResults,
    maxValue,
    testingData,
    isRawScoreCalc = false,
    dayDate,
) {
    try {
        console.log(`Updating database for user ${username}`)

        if (!testingData) {
            // Store the new last_updated date to be used to know when to re-run the AI analysis
            // This will run for every update, so the first time it will run X times for each day
            // but after that it will only run once per day as there will only be at most one raw score
            // calculation per day
            const { error } = await supabase
                .from("forum_users")
                .update({
                    last_updated: latestActivityDate,
                })
                .eq("forum_username", username)
                .eq("user_id", user.user_id)
                .eq("project_id", PROJECT_ID)

            if (error) {
                console.error(`Error updating database for ${username}:`, error.message)
            } else {
                console.log(`Successfully updated latestActivityDate in database for ${username}`)
            }
        }

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
            user_id: user.user_id,
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
    } catch (dbError) {
        console.error(`Database error for ${username}:`, dbError.message)
    }
}

module.exports = { updateUserData }
