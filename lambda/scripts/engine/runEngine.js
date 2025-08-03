const { getUserDisplayName } = require("./db/getUserDisplayName")
const { getSignalStrengthData } = require("./db/getSignalStrengthData")
const { getSignalStrengthConfig } = require("./db/getSignalStrengthConfig")
const { getExistingUserRawData } = require("./db/getExistingUserRawData")

const { setLastChecked, clearLastChecked } = require("./utils/lastCheckedUtils")
const { getRawActivityCombinedData } = require("./utils/getRawActivityCombinedData")
const { checkProjectSignalStrengthEnabled } = require("./utils/checkProjectSignalStrengthEnabled")
const { checkRawScoreCalculationsRequired } = require("./utils/checkRawScoreCalculationsRequired")
const { retryParentQueueItem } = require("./utils/retryParentQueueItem")
const { checkForSmartScoreGaps } = require("./utils/checkForSmartScoreGaps")

const { processRawScore } = require("./processRawScore")
const { processSmartScores } = require("./processSmartScores")

const adapterHandler = require("./platform_adapters/adapterHandler")

const { createClient } = require("@supabase/supabase-js")

// Function to run the engine
async function runEngine({ signalStrengthId, userId, projectId, signalStrengthUsername, dayDate, type, testingData }) {
    console.log("🏁 Running engine for signal strength:", signalStrengthId)

    let supabase

    try {
        // ================
        // Initialize logs
        // ================
        let logs = `signalStrengthUsername: ${signalStrengthUsername}`

        // ===========================
        // Initialize Supabase client
        // ===========================
        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

        // =================================
        // Get signal strength data from DB
        // =================================
        // This includes everything in the signal_strengths table
        // and all the prompts for the signal strength.
        const signalStrengthData = await getSignalStrengthData({ supabase, signalStrengthId })

        // ====================================================
        // Check if signal strength is enabled for the project
        // ====================================================
        const isEnabled = await checkProjectSignalStrengthEnabled({ supabase, projectId, signalStrengthId })
        if (!isEnabled) {
            const errorMessage = `Signal strength ${signalStrengthId} is not enabled for project ID: ${projectId}`
            console.warn(errorMessage)
            throw new Error(errorMessage)
        }

        // =================
        // Set last checked
        // =================
        // Set last checked as soon as it is known that
        // the signal strength is enabled for the project.
        setLastChecked({ supabase, userId, projectId, signalStrengthId })

        // ====================================
        // Fetch signal strength config from DB
        // ====================================
        // This includes everything in the project_signal_strengths table
        // for the signal strength and project.
        const signalStrengthConfig = await getSignalStrengthConfig({ supabase, projectId, signalStrengthId })
        const maxValue = signalStrengthConfig.max_value
        const previousDays = signalStrengthConfig.previous_days

        // If no dayDate is provided, set it to yesterday.
        if (!dayDate) {
            dayDate = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]
        }

        console.log(
            `🏁 Analyzing activity for userId ${userId}, projectId ${projectId}, signalStrengthUsername ${signalStrengthUsername} for dayDate ${dayDate}`,
        )

        // ================================
        // Fetch user display name from DB
        // ================================
        const userDisplayName = await getUserDisplayName({ supabase, userId })

        // ================================================
        // Fetch daily activity data from platform adapter
        // ================================================
        // This returns the dailyActivityData array and adapterLogs
        const { dailyActivityData, adapterLogs } = await adapterHandler.getDailyActivityData({
            supabase,
            userId,
            userDisplayName,
            projectId,
            signalStrengthName: signalStrengthData.name,
            signalStrengthUsername,
            signalStrengthConfig,
            dayDate,
        })

        // TODO: This might not work well e.g. if the user has no activity at all
        //       as it will show "Confirm ownership" on their profile page.
        //       It is an edge case, but should be considered.
        if (!dailyActivityData || dailyActivityData.length === 0) {
            // The console error is handled in the adapter.
            // This just exits the function as there is nothing to do,
            // but it still counts as a "completed" queue item.
            return
        }

        // Add adapter logs to existing logs string
        logs += adapterLogs

        // =============================
        // Process raw score queue item
        // =============================
        // If ai_request_queue type is "raw_score", then process it as a single raw score.
        if (type === "raw_score") {
            const isLastRawScoreToProcess = await processRawScore({
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
            })

            // If it is the last raw score to process,
            // trigger the parent again to run the smart score calculations.
            if (isLastRawScoreToProcess) {
                await retryParentQueueItem({ supabase, userId, projectId, signalStrengthId, dayDate })
            }

            // Return as it should not progress to smart score calculations as this is a raw_score queue item.
            // Returning here will set the state of this raw score queue item to "completed".
            return
        }

        // ==================================================
        // Fetch existing user_signal_strengths data from DB
        // ==================================================
        // Perform this after the raw score queue items are processed, as if it is the last raw score to process,
        // then it will continue to this step and get the newest data to check.
        const existingUserRawData = await getExistingUserRawData({
            supabase,
            userId,
            projectId,
            signalStrengthId,
            dailyActivityData,
        })

        // =============================================
        // Check if raw score calculations are required
        // =============================================
        // If any are required, add them to the ai_request_queue and then return early,
        // setting the parent queue item back to "pending" and attempt to run all the
        // raw score queue items it just created.
        const rawScoreCalculationsRequired = await checkRawScoreCalculationsRequired({
            supabase,
            userId,
            projectId,
            signalStrengthId,
            signalStrengthUsername,
            userDisplayName,
            dailyActivityData,
            existingUserRawData,
            testingData,
        })

        if (rawScoreCalculationsRequired) {
            console.log(`🔄 Raw score calculations are required, setting this queue item back to "pending".`)

            const queueItemUniqueIdentifier = `${userId}_${projectId}_${signalStrengthId}_${dayDate}`

            const { error: updateQueueItemError } = await supabase
                .from("ai_request_queue")
                .update({ status: "pending" })
                .eq("queue_item_unique_identifier", queueItemUniqueIdentifier)
                .select()

            if (updateQueueItemError) {
                const errorMessage = `Error updating ai_request_queue: ${updateQueueItemError.message}`
                console.error(errorMessage)
                throw new Error(errorMessage)
            }

            // Throw an error to stop the engine from continuing and setting the parent to "completed"
            throw new Error("⚠️ Raw score calculations are required. Exiting smart score engine run.")
        }

        // =========================================
        // Fetch raw activity combined data from DB
        // =========================================
        // This includes all the raw scores for the user for the previousDays
        const rawActivityCombinedData = await getRawActivityCombinedData({
            supabase,
            userId,
            projectId,
            signalStrengthId,
            testingData,
            previousDays,
            dayDate,
        })

        // =====================
        // Process smart scores
        // =====================
        await processSmartScores({
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
        })

        // ===========================
        // Check for gaps in the data
        // ===========================
        await checkForSmartScoreGaps({ supabase, userId, projectId, signalStrengthId })

        console.log(
            `☑️ Analysis complete for ${userDisplayName} (signalStrengthUsername: ${signalStrengthUsername}) for ${dayDate}`,
        )
    } catch (error) {
        if (error.status === 404 || error.message?.includes("404")) {
            console.log("⚠️ 404 error in runEngine")
        } else {
            console.error("🚨 Error in runEngine:", error)
        }
        throw error
    } finally {
        clearLastChecked({ supabase, userId, projectId, signalStrengthId })
    }
}

module.exports = { runEngine }
