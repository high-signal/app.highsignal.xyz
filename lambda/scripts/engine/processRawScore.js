const { analyzeUserData } = require("./ai/analyzeUserData")
const { updateUserData } = require("./db/updateUserData")

async function processRawScore({
    supabase,
    projectId,
    userId,
    dayDate,
    dailyActivityData,
    signalStrengthData,
    signalStrengthId,
    signalStrengthUsername,
    userDisplayName,
    maxValue,
    previousDays,
    testingData,
    logs,
}) {
    // Find the specific day data for the given dayDate
    const dayData = dailyActivityData.find((day) => day.date === dayDate)

    if (!dayData || dayData.data.length === 0) {
        // This should not happen as this raw_score queue item should not be created if there is no activity data.
        const errorMessage = `No activity data found for ${userDisplayName} (signalStrengthUsername: ${signalStrengthUsername}) on ${dayDate}`
        console.error(errorMessage)
        throw new Error(errorMessage)
    }

    const analysisResults = await analyzeUserData({
        signalStrengthData,
        userData: dayData.data,
        userDisplayName,
        signalStrengthUsername,
        maxValue,
        previousDays,
        testingData,
        dayDate: dayDate,
        type: "raw",
        logs: logs + `Day ${dayDate} activity: ${dayData.data.length}\n`,
    })

    // === Validity check on maxValue ===
    if (analysisResults && !analysisResults.error) {
        if (analysisResults[signalStrengthUsername].value > maxValue) {
            console.log(`User ${signalStrengthUsername} has a score greater than ${maxValue}. Setting to ${maxValue}.`)
            analysisResults[signalStrengthUsername].value = maxValue
        }
    }

    // === Store the analysis results in the database ===
    if (analysisResults && !analysisResults.error) {
        await updateUserData({
            supabase,
            projectId,
            signalStrengthId,
            signalStrengthUsername,
            userId,
            analysisResults,
            maxValue,
            testingData,
            isRawScoreCalc: true,
            dayDate: dayDate,
        })
    } else {
        const errorMessage = `Analysis failed for ${signalStrengthUsername} on day ${dayDate}: ${analysisResults?.error || "Unknown error"}`
        console.error(errorMessage)
        throw new Error(errorMessage)
    }

    // Check the ai_request_queue to see if there are any more raw score calculations to process.
    // If this was the last raw score to process, then return true.
    const { data: aiRequestQueueData, error: aiRequestQueueError } = await supabase
        .from("ai_request_queue")
        .select("*")
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .eq("signal_strength_id", signalStrengthId)
        .eq("type", "raw_score")
        .neq("status", "completed")

    if (aiRequestQueueError) {
        const errorMessage = `Error checking ai_request_queue: ${aiRequestQueueError.message}`
        console.error(errorMessage)
        throw new Error(errorMessage)
    }

    // Filter out the current raw score queue item from the ai_request_queue.
    let queueItemUniqueIdentifier = `${userId}_${projectId}_${signalStrengthId}_${dayDate}_RAW`
    if (testingData) {
        queueItemUniqueIdentifier = queueItemUniqueIdentifier + "_TEST"
    }

    const cleanedAiRequestQueueData = aiRequestQueueData.filter(
        (item) => item.queue_item_unique_identifier !== queueItemUniqueIdentifier,
    )

    if (cleanedAiRequestQueueData.length > 0) {
        return false
    } else {
        return true
    }
}

module.exports = { processRawScore }
