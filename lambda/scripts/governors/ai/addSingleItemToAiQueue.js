const { createClient } = require("@supabase/supabase-js")

const { storeStatsInDb } = require("../../utils/storeStatsInDb")

// Add a single item to the AI queue
async function addSingleItemToAiQueue({ signalStrengthName, userId, projectId, signalStrengthUsername, testingData }) {
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

        let queueItemUniqueIdentifier = `${userId}_${projectId}_${signalStrengthId}_${dayDate}`
        if (testingData) {
            queueItemUniqueIdentifier = queueItemUniqueIdentifier + "_TEST_" + testingData.requestingUserId
        }

        // NOTE: z_ must be used as the objects are ordered alphabetically in the function cache,
        // and since testing_data is conditional, it must be the last parameter so it does not
        // change the order of the other parameters.
        const { error: addSingleUserSignalStrengthToAiQueueError } = await supabase.rpc(
            "add_single_user_signal_strength_to_ai_queue",
            {
                p_queue_item_unique_identifier: queueItemUniqueIdentifier,
                p_user_id: userId,
                p_project_id: projectId,
                p_signal_strength_id: signalStrengthId,
                p_signal_strength_username: signalStrengthUsername,
                p_day: dayDate,
                z_testing_data: testingData,
            },
        )

        if (addSingleUserSignalStrengthToAiQueueError) {
            const errorMessage = `Failed to add single user signal strength to AI queue: ${addSingleUserSignalStrengthToAiQueueError.message}`
            console.error(errorMessage)
            throw errorMessage
        }

        // ==============================
        // Update action count in the DB
        // ==============================
        // One action was performed to add a single item to the AI queue
        await storeStatsInDb({
            actionCount: 1,
        })
    } catch (error) {
        const errorMessage = `Error adding single item to AI queue: ${error.message}`
        console.error(errorMessage)
        throw errorMessage
    }
}

module.exports = {
    addSingleItemToAiQueue,
}
