async function updateUserTestingData(
    supabase,
    PROJECT_ID,
    SIGNAL_STRENGTH_ID,
    username,
    user,
    analysisResults,
    testingData,
) {
    try {
        console.log(`Updating testing data in database for user ${username}`)

        // Store the testing data in the user_signal_strengths_tests table
        const { error: signalError } = await supabase.from("user_signal_strengths_tests").upsert(
            {
                requesting_user_id: testingData.requestingUserId,
                test_prompt: testingData.testingPrompt,
                user_id: user.user_id,
                project_id: PROJECT_ID,
                signal_strength_id: SIGNAL_STRENGTH_ID,
                value: analysisResults[username].value,
                summary: analysisResults[username].summary,
                description: analysisResults[username].description,
                improvements: analysisResults[username].improvements,
                explained_reasoning: analysisResults[username].explainedReasoning,
                model: analysisResults.model,
            },
            {
                onConflict: "user_id,project_id,signal_strength_id,requesting_user_id",
            },
        )

        if (signalError) {
            console.error(`Error storing testing data for ${username}:`, signalError.message)
        } else {
            console.log(`Successfully stored testing data in database for ${username}`)
        }
    } catch (dbError) {
        console.error(`Database error for ${username}:`, dbError.message)
    }
}

module.exports = { updateUserTestingData }
