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
    logs,
}) {
    // TODO: This only works for yesterday and does not account for any missed previous days
    // I should at least try to get the last e.g. 3 days of smart scores to fill in gaps if the script did not run for a day or two
    const dateYesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]

    // If a non-test smart score is already in the database for dateYesterday, skip the analysis
    let existingQuery = supabase
        .from("user_signal_strengths")
        .select("id")
        .eq("day", dateYesterday)
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
            `Smart score for ${userDisplayName} (signalStrengthUsername: ${signalStrengthUsername}) on ${dateYesterday} already exists in the database. Skipping...`,
        )
        console.log("Analysis complete.")
        return
    }

    const analysisResults = await analyzeUserData(
        signalStrengthData,
        rawActivityCombinedData,
        signalStrengthUsername,
        maxValue,
        previousDays,
        testingData,
        dateYesterday,
        "smart", // type
        logs,
    )

    // === Validity check on maxValue ===
    if (analysisResults && !analysisResults.error) {
        if (analysisResults[signalStrengthUsername].value > maxValue) {
            console.log(`User ${signalStrengthUsername} has a score greater than ${maxValue}. Setting to ${maxValue}.`)
            analysisResults[signalStrengthUsername].value = maxValue
        }
    }

    // === Store the analysis results in the database ===
    if (analysisResults && !analysisResults.error) {
        await updateUserData(
            supabase,
            projectId,
            signalStrengthId,
            signalStrengthUsername,
            userId,
            analysisResults,
            maxValue,
            testingData,
            false, // isRawScoreCalc
            dateYesterday,
        )
        console.log(
            `Smart score successfully updated for ${userDisplayName} (signalStrengthUsername: ${signalStrengthUsername})`,
        )
        console.log("Analysis complete .")
    } else {
        console.error(`Analysis failed for ${signalStrengthUsername}:`, analysisResults?.error || "Unknown error")
    }
}

module.exports = { processSmartScores }
