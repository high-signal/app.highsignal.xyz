const { analyzeUserData } = require("./ai/analyzeUserData")
const { updateUserData } = require("./db/updateUserData")

async function processRawScores({
    supabase,
    projectId,
    userId,
    dailyActivityData,
    existingUserRawData,
    signalStrengthData,
    signalStrengthId,
    signalStrengthUsername,
    userDisplayName,
    maxValue,
    previousDays,
    testingData,
    logs,
}) {
    const analysisPromises = dailyActivityData.map(async (day) => {
        if (day.data.length > 0) {
            if (existingUserRawData.length > 0 && existingUserRawData.find((item) => item.day === day.date)) {
                console.log(
                    `Raw Calc: Day ${day.date} already exists in the database. Skipping raw score calculation...`,
                )
                return
            }

            const analysisResults = await analyzeUserData(
                signalStrengthData,
                day.data,
                signalStrengthUsername,
                maxValue,
                previousDays,
                testingData,
                day.date,
                "raw", // type
                logs + `Day ${day.date} activity: ${day.data.length}\n`,
            )

            // === Validity check on maxValue ===
            if (analysisResults && !analysisResults.error) {
                if (analysisResults[signalStrengthUsername].value > maxValue) {
                    console.log(
                        `User ${signalStrengthUsername} has a score greater than ${maxValue}. Setting to ${maxValue}.`,
                    )
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
                    true, // isRawScoreCalc
                    day.date,
                )
                console.log(`User data successfully updated for day ${day.date}`)
                console.log("")
            } else {
                console.error(
                    `Analysis failed for ${signalStrengthUsername} on day ${day.date}:`,
                    analysisResults?.error || "Unknown error",
                )
            }
        }
    })

    // Wait for all daily analyses to complete
    await Promise.all(analysisPromises)
}

module.exports = { processRawScores }
