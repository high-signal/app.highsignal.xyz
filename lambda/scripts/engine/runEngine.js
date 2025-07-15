const { getUserDisplayName } = require("./db/getUserDisplayName")
const { getSignalStrengthData } = require("./db/getSignalStrengthData")
const { getSignalStrengthConfig } = require("./db/getSignalStrengthConfig")
const { getExistingUserRawData } = require("./db/getExistingUserRawData")

const { setLastChecked, clearLastChecked } = require("./utils/lastCheckedUtils")
const { getRawActivityCombinedData } = require("./utils/getRawActivityCombinedData")
const { checkProjectSignalStrengthEnabled } = require("./utils/checkProjectSignalStrengthEnabled")

const { processRawScores } = require("./processRawScores")
const { processSmartScores } = require("./processSmartScores")

const adapterHandler = require("./platform_adapters/adapterHandler")

const { createClient } = require("@supabase/supabase-js")

// Function to run the engine
async function runEngine({ signalStrengthName, userId, projectId, signalStrengthUsername, testingData }) {
    console.log("\n**************************************************")
    console.log("Running engine for signal strength:", signalStrengthName)

    // TODO: Change this
    const forum_username = signalStrengthUsername

    let supabase
    let signalStrengthId

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
        const signalStrengthData = await getSignalStrengthData({ supabase, signalStrengthName })
        signalStrengthId = signalStrengthData.id

        // ====================================================
        // Check if signal strength is enabled for the project
        // ====================================================
        const isEnabled = await checkProjectSignalStrengthEnabled({ supabase, projectId, signalStrengthId })
        if (!isEnabled) {
            console.warn(`Signal strength ${signalStrengthName} is not enabled for project ID: ${projectId}`)
            return
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

        console.log(
            `Analyzing activity for userId ${userId}, project ${projectId}, signal strength username ${signalStrengthUsername}`,
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
            signalStrengthName,
            signalStrengthUsername,
            signalStrengthConfig,
        })

        // Add adapter logs to existing logs string
        logs += adapterLogs

        // ==================================================
        // Fetch existing user_signal_strengths data from DB
        // ==================================================
        const existingUserRawData = await getExistingUserRawData({
            supabase,
            userId,
            projectId,
            signalStrengthId,
            dailyActivityData,
        })

        // ===================
        // Process raw scores
        // ===================
        await processRawScores({
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
        })

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
        })

        // =====================
        // Process smart scores
        // =====================
        // TODO: This only works for yesterday and does not account for any missed previous days
        // I should at least try to get the last
        // e.g. 3 days of smart scores to fill in gaps if the script did not run for a day or two
        const dateYesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]

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
            dayDate: dateYesterday,
            logs,
        })

        console.log(`Analysis complete for ${userDisplayName} (signalStrengthUsername: ${signalStrengthUsername})`)
    } catch (error) {
        console.error("Error in analyzeForumUserActivity:", error)
    } finally {
        clearLastChecked({ supabase, userId, projectId, signalStrengthId })
    }
}

module.exports = { runEngine }
