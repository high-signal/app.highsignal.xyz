const { createClient } = require("@supabase/supabase-js")

// For each signal strength, add all valid users to the AI queue
async function addSingleItemToAiQueue({ signalStrengthName, userId, projectId, testingData }) {
    try {
        console.log("Adding single item to AI queue...")

        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

        // Get the signal strength ID
        const { data: signalStrengthData, error: signalStrengthDataError } = await supabase
            .from("signal_strengths")
            .select("id")
            .eq("name", signalStrengthName)
            .single()

        if (signalStrengthDataError) {
            const errorMessage = `Failed to get signal strength ID: ${signalStrengthDataError.message}`
            console.error(errorMessage)
            throw errorMessage
        }

        const signalStrengthId = signalStrengthData.id

        // Default to yesterday. Format: YYYY-MM-DD
        const dayDate = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]

        // NOTE: z_ must be used as the objects are ordered alphabetically in the function cache,
        // and since testing_data is conditional, it must be the last parameter so it does not
        // change the order of the other parameters.
        const { error: discourseForumError } = await supabase.rpc("add_single_discourse_forum_user_to_ai_queue", {
            user_id: userId,
            project_id: projectId,
            signal_strength_id: signalStrengthId,
            day: dayDate,
            z_testing_data: testingData,
        })

        if (discourseForumError) {
            const errorMessage = `Failed to add single forum user to AI queue: ${discourseForumError.message}`
            console.error(errorMessage)
            throw errorMessage
        }
    } catch (error) {
        const errorMessage = `Error adding single item to AI queue: ${error.message}`
        console.error(errorMessage)
        throw errorMessage
    }
}

module.exports = {
    addSingleItemToAiQueue,
}
