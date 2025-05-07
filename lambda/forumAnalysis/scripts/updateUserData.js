async function updateUserData(
    supabase,
    PROJECT_ID,
    SIGNAL_STRENGTH_ID,
    username,
    user,
    latestActivityDate,
    analysisResults,
) {
    try {
        console.log(`Updating database for user ${username}`)

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

        // Store the analysis results in the user_signal_strengths table
        // Store the last_updated date again to be used here in the ranking algorithm
        const { error: signalError } = await supabase.from("user_signal_strengths").upsert(
            {
                user_id: user.user_id,
                project_id: PROJECT_ID,
                signal_strength_id: SIGNAL_STRENGTH_ID,
                value: analysisResults[username].value,
                summary: analysisResults[username].summary,
                description: analysisResults[username].description,
                improvements: analysisResults[username].improvements,
                explained_reasoning: analysisResults[username].explainedReasoning,
                model: analysisResults.model,
                temperature: analysisResults.temperature,
                prompt: analysisResults.prompt,
                max_chars: analysisResults.maxChars,
                logs: analysisResults.logs,
                last_updated: latestActivityDate,
                last_checked: null,
            },
            {
                onConflict: "user_id,project_id,signal_strength_id",
            },
        )

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
