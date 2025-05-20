const { getSignalStrengthConfig } = require("./getSignalStrengthConfig")
const { fetchUserActivity } = require("./fetchUserActivity")
const { updateUserData } = require("./updateUserData")
const { updateRequired } = require("./updateRequired")
const { analyzeUserData } = require("./analyzeUserData")
const { updateUserTestingData } = require("./updateUserTestingData")
const { createClient } = require("@supabase/supabase-js")

// Function to analyze forum user activity
async function analyzeForumUserActivity(user_id, project_id, forum_username, testingData) {
    const SIGNAL_STRENGTH_NAME = "discourse_forum"

    // If testingData.forum_username is provided, use it instead of the forum_username parameter
    if (testingData && testingData.forum_username) {
        forum_username = testingData.forum_username
    }

    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

        const { data: signalStrengthData, error: signalError } = await supabase
            .from("signal_strengths")
            .select(
                `
                *,
                prompts (
                    prompt
                )
            `,
            )
            .eq("name", SIGNAL_STRENGTH_NAME)
            .single()

        if (signalError) {
            console.error("Error fetching signal strength ID:", signalError)
            // Continue without triggering analysis
            return //NextResponse.json(signalError)
        }

        if (!signalStrengthData) {
            console.log(`No signal strength found with name: ${SIGNAL_STRENGTH_NAME}`)
            // Continue without triggering analysis
            return //NextResponse.json("No signal strength found with name: " + SIGNAL_STRENGTH_NAME)
        }

        const signal_strength_id = signalStrengthData.id

        // Check if this signal strength is enabled for the project
        const { data: projectSignalData, error: projectSignalError } = await supabase
            .from("project_signal_strengths")
            .select("enabled")
            .eq("project_id", project_id)
            .eq("signal_strength_id", signal_strength_id)
            .single()

        if (projectSignalError || !projectSignalData || !projectSignalData.enabled) {
            console.log(`Signal strength ${SIGNAL_STRENGTH_NAME} is not enabled for this project`)
            // Continue without triggering analysis
            return //NextResponse.json("Signal strength is not enabled for this project")
        }

        // === Fetch signal strength config from Supabase ===
        console.log(`Fetching signal strength config from Supabase for project ${project_id}...`)
        const signalStrengthConfig = await getSignalStrengthConfig(supabase, project_id, signal_strength_id)
        console.log("signalStrengthConfig", signalStrengthConfig)

        if (!signalStrengthConfig || signalStrengthConfig.length === 0) {
            console.error("Signal strength config not found")
            return
        }

        const enabled = signalStrengthConfig[0].enabled
        const maxValue = signalStrengthConfig[0].max_value
        const url = signalStrengthConfig[0].url
        const previousDays = signalStrengthConfig[0].previous_days

        if (!enabled) {
            console.log("Signal strength is not enabled for this project")
            return
        }

        // === Get user data from Supabase ===
        console.log(`Fetching user data from Supabase for user ${user_id}...`)
        const { data: userData, error: userError } = await supabase
            .from("forum_users")
            .select("*")
            .eq("user_id", user_id)
            .eq("project_id", project_id)
            .single()

        if (userError) {
            console.error("Error fetching user data:", userError)
            return
        }

        console.log("userData", userData)

        const lastUpdated = userData.last_updated

        // === Get user display name from Supabase ===
        console.log(`Fetching user display name from Supabase for user ${user_id}...`)
        const { data: userDisplayName, error: userDisplayNameError } = await supabase
            .from("users")
            .select("display_name")
            .eq("id", user_id)
            .single()

        if (userDisplayNameError) {
            console.error("Error fetching user display name:", userDisplayNameError)
            return
        }

        const displayName = userDisplayName.display_name
        console.log("displayName", displayName)

        // === Fetch activity data from forum API ===
        console.log(`Fetching activity for user: ${forum_username}`)
        const activityData = await fetchUserActivity(url, forum_username)
        console.log(`Processed ${activityData?.length || 0} activities for ${forum_username}`)

        if (!activityData || activityData.length === 0) {
            console.error("No activity data found for this user")
            return
        }

        // === Get the latest activity date for the update ===
        const latestActivityDate = activityData.sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        )[0].updated_at

        // === Check if update is required ===
        if (!testingData && !updateRequired(lastUpdated, latestActivityDate)) {
            console.log("User data is up to date. No analysis needed.")
            return
        }

        // Filter activity data to the past X days
        const filteredActivityData = activityData.filter(
            (activity) =>
                new Date(activity.updated_at) > new Date(new Date().setDate(new Date().getDate() - previousDays)),
        )

        console.log(`Filtered activity data to the past ${previousDays} days: ${filteredActivityData.length}`)

        // === Analyze user data with AI ===
        const analysisResults = await analyzeUserData(
            signalStrengthData,
            filteredActivityData,
            forum_username,
            displayName,
            maxValue,
            previousDays,
            testingData,
        )

        // === Validity check on maxValue ===
        if (analysisResults && !analysisResults.error) {
            if (analysisResults[forum_username].value > maxValue) {
                console.log(`User ${forum_username} has a score greater than ${maxValue}. Setting to ${maxValue}.`)
                analysisResults[forum_username].value = maxValue
            }
        }

        // === Store the analysis results in the database ===
        if (analysisResults && !analysisResults.error) {
            await updateUserData(
                supabase,
                project_id,
                signal_strength_id,
                forum_username,
                userData,
                latestActivityDate,
                analysisResults,
                maxValue,
                testingData,
            )
            console.log("User data successfully updated")
        } else {
            console.error(`Analysis failed for ${forum_username}:`, analysisResults?.error || "Unknown error")
        }
    } catch (error) {
        console.error("Error in analyzeForumUserActivity:", error)
    }
}

module.exports = { analyzeForumUserActivity }
