const { getSignalStrengthConfig } = require("./getSignalStrengthConfig")
const { fetchUserActivity } = require("./fetchUserActivity")
const { updateUserData } = require("./updateUserData")
const { updateRequired } = require("./updateRequired")
const { analyzeUserData } = require("./analyzeUserData")
const { createClient } = require("@supabase/supabase-js")
const { clearLastChecked } = require("./clearLastChecked")

// Function to analyze forum user activity (OLD legacy script)
async function analyzeForumUserActivityOLD(user_id, project_id, signalStrengthUsername, testingData) {
    const SIGNAL_STRENGTH_NAME = "discourse_forum"

    const forum_username = signalStrengthUsername

    try {
        let logs = `forum_username: ${forum_username}`

        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

        // Returns all prompts for the signal strength
        // Prompt filtering for each type and date is carried out for each analysis
        const { data: signalStrengthData, error: signalError } = await supabase
            .from("signal_strengths")
            .select(
                `
                *,
                prompts (
                    *
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
            .select(
                `
                enabled,
                projects (
                    display_name
                )
            `,
            )
            .eq("project_id", project_id)
            .eq("signal_strength_id", signal_strength_id)
            .single()

        if (projectSignalError || !projectSignalData || !projectSignalData.enabled) {
            console.log(`Signal strength ${SIGNAL_STRENGTH_NAME} is not enabled for this project`)
            // Continue without triggering analysis
            clearLastChecked(supabase, user_id, project_id, signal_strength_id)
            return //NextResponse.json("Signal strength is not enabled for this project")
        }

        // === Fetch signal strength config from Supabase ===
        const signalStrengthConfig = await getSignalStrengthConfig(supabase, project_id, signal_strength_id)
        console.log("")
        console.log("**************************************************")
        console.log(
            "Analyzing forum user activity for user",
            user_id,
            "and project",
            project_id,
            "and forum username",
            forum_username,
        )
        // console.log(`signalStrengthConfig for ${projectSignalData.projects.display_name}\n`, signalStrengthConfig)

        if (!signalStrengthConfig || signalStrengthConfig.length === 0) {
            console.error("Signal strength config not found")
            clearLastChecked(supabase, user_id, project_id, signal_strength_id)
            return
        }

        const enabled = signalStrengthConfig[0].enabled
        const maxValue = signalStrengthConfig[0].max_value
        const url = signalStrengthConfig[0].url
        const previousDays = signalStrengthConfig[0].previous_days

        if (!enabled) {
            console.log(
                `Signal strength ${SIGNAL_STRENGTH_NAME} is not enabled for this project: ${projectSignalData.projects.display_name}`,
            )
            clearLastChecked(supabase, user_id, project_id, signal_strength_id)
            return
        }

        // Set the last_checked value so that the user profile page shows the loading animation
        // even when this update is triggered automatically each day
        const { error: lastCheckError } = await supabase.from("user_signal_strengths").upsert(
            {
                user_id: user_id,
                project_id: project_id,
                signal_strength_id: signal_strength_id,
                last_checked: Math.floor(Date.now() / 1000),
                request_id: `last_checked_${user_id}_${project_id}_${signal_strength_id}`,
                created: 99999999999999,
            },
            {
                onConflict: "request_id",
            },
        )

        if (lastCheckError) {
            console.error(`Error updating last_checked for ${forum_username}:`, lastCheckError.message)
        } else {
            console.log(`Successfully updated last_checked for ${forum_username}`)
        }

        // === Get user data from Supabase ===
        const { data: userData, error: userError } = await supabase
            .from("forum_users")
            .select(
                `
                *,
                users (
                    display_name
                )
            `,
            )
            .eq("user_id", user_id)
            .eq("project_id", project_id)
            .not("forum_username", "is", null)
            .single()

        if (userError) {
            console.error("Error fetching user data:", userError)
            clearLastChecked(supabase, user_id, project_id, signal_strength_id)
            return
        }

        // console.log(`forum_users data for ${userData.users.display_name}`, userData)

        const lastUpdated = userData.last_updated
        const displayName = userData.users.display_name

        // === Fetch activity data from forum API ===
        console.log(`Fetching forum activity data for ${displayName} (forum username: ${forum_username})`)
        const activityData = await fetchUserActivity(url, forum_username)
        console.log(
            `Processed ${activityData?.length || 0} activities for ${displayName} (forum username: ${forum_username})`,
        )
        logs += `\nTotal API activities:  ${activityData?.length || 0}`

        if (!activityData || activityData.length === 0) {
            console.error(`No activity data found for ${displayName} (forum username: ${forum_username})`)
            clearLastChecked(supabase, user_id, project_id, signal_strength_id)
            return
        }

        // === Get the latest activity date for the update ===
        const latestActivityDate = activityData.sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        )[0].updated_at

        // === Check if update is required ===
        if (!testingData && !updateRequired(lastUpdated, latestActivityDate)) {
            console.log(
                `${displayName} (forum username: ${forum_username}) forum data is up to date. No raw daily analysis needed.`,
            )
        } else {
            // Filter activity data to the past X days
            const filteredActivityData = activityData.filter(
                (activity) =>
                    new Date(activity.updated_at) > new Date(new Date().setDate(new Date().getDate() - previousDays)),
            )

            console.log(`Filtered activity data to the past ${previousDays} days: ${filteredActivityData.length}`)
            logs += `\nActivity past ${previousDays} days: ${filteredActivityData.length}`

            // console.log("filteredActivityData", filteredActivityData)

            // Create an array of filteredActivityData that contains one element per day
            // starting from yesterday and going back previousDays
            const dailyActivityData = []
            for (let i = 0; i < previousDays; i++) {
                const date = new Date(new Date().setDate(new Date().getDate() - (i + 1))) // Start yesterday
                const activitiesForDay = filteredActivityData.filter((activity) => {
                    const activityDate = new Date(activity.updated_at)
                    return activityDate.toISOString().split("T")[0] === date.toISOString().split("T")[0]
                })
                dailyActivityData.push({
                    date: date.toISOString().split("T")[0],
                    data: activitiesForDay,
                })
            }

            console.log(
                "Number of days to analyze for raw score calculation:",
                dailyActivityData.filter((day) => day.data && day.data.length > 0).length,
            )
            logs += `\nUnique activity days: ${dailyActivityData.filter((day) => day.data && day.data.length > 0).length}\n`

            // For each day with data in dailyActivityData, run the analyzeUserData function
            const analysisPromises = dailyActivityData.map(async (day) => {
                if (day.data.length > 0) {
                    // Check if the day is already in the database for the raw score calculation
                    const { data: existingData, error: existingDataError } = await supabase
                        .from("user_signal_strengths")
                        .select("*")
                        .eq("day", day.date)
                        .eq("user_id", user_id)
                        .eq("project_id", project_id)
                        .eq("signal_strength_id", signal_strength_id)
                        .not("raw_value", "is", null)

                    if (existingDataError) {
                        console.error("Error fetching existing data:", existingDataError)
                        return
                    }

                    if (!testingData && existingData && existingData.length > 0) {
                        console.log(`Day ${day.date} already exists in the database. Skipping raw score calculation...`)
                        return
                    }

                    const analysisResults = await analyzeUserData(
                        signalStrengthData,
                        day.data,
                        forum_username,
                        displayName,
                        maxValue,
                        previousDays,
                        testingData,
                        day.date,
                        "raw", // type
                        logs + `Day ${day.date} activity: ${day.data.length}\n`,
                    )

                    // === Validity check on maxValue ===
                    if (analysisResults && !analysisResults.error) {
                        if (analysisResults[forum_username].value > maxValue) {
                            console.log(
                                `User ${forum_username} has a score greater than ${maxValue}. Setting to ${maxValue}.`,
                            )
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
                            true, // isRawScoreCalc
                            day.date,
                        )
                        console.log(`User data successfully updated for day ${day.date}`)
                        console.log("")
                    } else {
                        console.error(
                            `Analysis failed for ${forum_username} on day ${day.date}:`,
                            analysisResults?.error || "Unknown error",
                        )
                    }
                }
            })

            // Wait for all daily analyses to complete
            await Promise.all(analysisPromises)
        }

        // After the raw daily analysis is complete, generate a smart score for the user

        let rawActivityCombinedData = []
        // TODO: Ignore tests for now.

        rawActivityCombinedData =
            (
                await supabase
                    .from("user_signal_strengths")
                    .select("*")
                    .eq("user_id", user_id)
                    .eq("project_id", project_id)
                    .eq("signal_strength_id", signal_strength_id)
                    .not("raw_value", "is", null)
                    .is("test_requesting_user", null)
                    .gte(
                        "day",
                        new Date(new Date().setDate(new Date().getDate() - previousDays)).toISOString().split("T")[0],
                    )
                    .order("day", { ascending: false })
            ).data || []

        rawActivityCombinedData = rawActivityCombinedData.map((item) => ({
            id: item.id,
            summary: item.summary,
            description: item.description,
            improvements: item.improvements,
            explained_reasoning: item.explained_reasoning,
            raw_value: item.raw_value,
            max_value: item.max_value,
            day: item.day,
        }))

        // This is a catch for an edge case where duplicate raw score rows for the same day are created
        // It is important that raw scores and not double counted towards the smart score
        // In case there are any duplicates for the same day, keep the one with the larger id value
        const uniqueDays = [...new Set(rawActivityCombinedData.map((item) => item.day))]
        rawActivityCombinedData = uniqueDays.map((day) => {
            const itemsForDay = rawActivityCombinedData.filter((item) => item.day === day)
            return itemsForDay.reduce((max, current) => (current.id > max.id ? current : max))
        })

        // TODO: Add previous smart score (if it exists) to the end of the rawActivityCombinedData array so it can be
        // used as a reference for the analysis. Tell the smart prompt how to use it and to try not vary wildly unless
        // there is a good reason.

        // TODO: This only works for yesterday and does not account for any missed previous days
        // I should at least try to get the last e.g. 3 days of smart scores to fill in gaps if the script did not run for a day or two
        const dateYesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]

        // If a non-test smart score is already in the database for dateYesterday, skip the analysis
        const { data: existingData, error: existingError } = await supabase
            .from("user_signal_strengths")
            .select("id")
            .eq("day", dateYesterday)
            .eq("user_id", user_id)
            .eq("project_id", project_id)
            .eq("signal_strength_id", signal_strength_id)
            .not("value", "is", null)
            .is("test_requesting_user", null)
            .single()

        if (!testingData && existingData) {
            console.log(
                `Smart score for ${displayName} (forum username: ${forum_username}) on ${dateYesterday} already exists in the database. Skipping...`,
            )
            console.log("Analysis complete.")
            clearLastChecked(supabase, user_id, project_id, signal_strength_id)
            return
        }

        const analysisResults = await analyzeUserData(
            signalStrengthData,
            rawActivityCombinedData,
            forum_username,
            displayName,
            maxValue,
            previousDays,
            testingData,
            dateYesterday,
            "smart", // type
            logs,
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
                false, // isRawScoreCalc
                dateYesterday,
            )
            console.log(`Smart score successfully updated for ${displayName} (forum username: ${forum_username})`)
            console.log("Analysis complete.")
        } else {
            console.error(`Analysis failed for ${forum_username}:`, analysisResults?.error || "Unknown error")
        }

        clearLastChecked(supabase, user_id, project_id, signal_strength_id)
    } catch (error) {
        console.error("Error in analyzeForumUserActivityOLD:", error)
        if (supabase) {
            clearLastChecked(supabase, user_id, project_id, signal_strength_id)
        }
    }
}

module.exports = { analyzeForumUserActivityOLD }
