const { analyzeUserData } = require("./ai/analyzeUserData")
const { updateUserData } = require("./db/updateUserData")

async function processSmartScores({
    supabase,
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
    // If a non-test smart score is already in the database for dayDate, skip the analysis
    let existingQuery = supabase
        .from("user_signal_strengths")
        .select("id")
        .eq("day", dayDate)
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .eq("signal_strength_id", signalStrengthId)
        .not("value", "is", null)

    if (testingData) {
        existingQuery = existingQuery.not("test_requesting_user", "is", null)
    } else {
        existingQuery = existingQuery.is("test_requesting_user", null)
    }

    const { data: existingData, error: existingError } = await existingQuery.single()

    if (!testingData && existingData) {
        console.log(
            `✅ Smart score for ${userDisplayName} (signalStrengthUsername: ${signalStrengthUsername}) on ${dayDate} already exists in the database. Skipping...`,
        )
        console.log("Analysis complete.")
        return
    }

    const analysisResults = await analyzeUserData({
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
            isRawScoreCalc: false,
            dayDate: dayDate,
        })
    } else {
        console.error(`Analysis failed for ${signalStrengthUsername}:`, analysisResults?.error || "Unknown error")
    }
}

module.exports = { processSmartScores }
