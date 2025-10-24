const { analyzeUserData } = require("./ai/analyzeUserData")
const { updateUserData } = require("./db/updateUserData")
const { clearLastChecked } = require("./utils/lastCheckedUtils")

async function processSmartScores({
    supabase,
    type,
    projectId,
    userId,
    rawActivityCombinedData,
    signalStrengthData,
    signalStrengthId,
    signalStrengthUsername,
    userDisplayName,
    maxValue,
    previousDays,
    testingData,
    dayDate,
    logs,
}) {
    // Check if a non-test smart score already exists for the dayDate
    if (!testingData) {
        // If a non-test smart score is already in the database for dayDate, skip the analysis
        let existingDataQuery = supabase
            .from("user_signal_strengths")
            .select("id")
            .eq("day", dayDate)
            .eq("user_id", userId)
            .eq("project_id", projectId)
            .eq("signal_strength_id", signalStrengthId)
            .not("value", "is", null)
            .is("test_requesting_user", null)

        // If there is more than one row, run the analysis again
        // as the race condition protection will delete all but the latest row
        const { data: existingData, error: existingError } = await existingDataQuery

        if (existingError) {
            const errorMessage = `Error getting existing data for ${signalStrengthUsername}: ${existingError.message}`
            console.error(errorMessage)
            throw new Error(errorMessage)
        }

        if (existingData && existingData.length === 1) {
            console.log(
                `✅ Smart score for ${userDisplayName} (signalStrengthUsername: ${signalStrengthUsername}) on ${dayDate} already exists in the database. Skipping...`,
            )
            return
        }
    }

    const analysisResults = await analyzeUserData({
        supabase,
        userId,
        projectId,
        signalStrengthId,
        signalStrengthData,
        userData: rawActivityCombinedData,
        userDisplayName,
        signalStrengthUsername,
        maxValue,
        previousDays,
        testingData,
        dayDate: dayDate,
        type: "smart",
        logs,
    })

    if (analysisResults && !analysisResults.error) {
        // === Validity check on maxValue ===
        if (analysisResults[signalStrengthUsername].value > maxValue) {
            console.log(`User ${signalStrengthUsername} has a score greater than ${maxValue}. Setting to ${maxValue}.`)
            analysisResults[signalStrengthUsername].value = maxValue
        }

        // === Store the analysis results in the database ===
        await updateUserData({
            supabase,
            type,
            projectId,
            signalStrengthId,
            signalStrengthUsername,
            userId,
            analysisResults,
            maxValue,
            testingData,
            isRawScoreCalc: false,
            dayDate: dayDate,
        })

        // Clear last_checked value when smart score is complete
        await clearLastChecked({ supabase, userId, projectId, signalStrengthId })
    } else {
        console.error(`Analysis failed for ${signalStrengthUsername}:`, analysisResults?.error || "Unknown error")
    }
}

module.exports = { processSmartScores }
