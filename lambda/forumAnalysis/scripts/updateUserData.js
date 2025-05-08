async function updateUserData(
    supabase,
    PROJECT_ID,
    SIGNAL_STRENGTH_ID,
    username,
    user,
    latestActivityDate,
    analysisResults,
    testingData,
) {
    try {
        console.log(`Updating database for user ${username}`)

        if (!testingData) {
            // Store the new last_updated date to be used to know when to re-run the AI analysis
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
            value: analysisResults[username].value,
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
            model: testingData?.testingModel || analysisResults.model,
            temperature: testingData?.testingTemperature || analysisResults.temperature,
            prompt: testingData?.testingPrompt || analysisResults.prompt,
            max_chars: testingData?.testingMaxChars || analysisResults.maxChars,
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
