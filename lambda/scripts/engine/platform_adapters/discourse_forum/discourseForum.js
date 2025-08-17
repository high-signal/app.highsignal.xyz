const { fetchUserActivityFromDb } = require("./fetchUserActivityFromDb")

async function getDailyActivityData({
    supabase,
    userId,
    userDisplayName,
    projectId,
    signalStrengthUsername,
    signalStrengthConfig,
    dayDate,
}) {
    let adapterLogs = ""
    const forum_username = signalStrengthUsername
    const previousDays = signalStrengthConfig.previous_days
    const url = signalStrengthConfig.url

    // ======================
    // Get user data from DB
    // ======================
    const { data: userData, error: userError } = await supabase
        .from("forum_users")
        .select("*")
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .not("forum_username", "is", null)
        .single()

    if (userError) {
        console.error("Error fetching user data:", userError)
        throw userError
    }

    // === Fetch activity data from forum API ===
    console.log(`👀 Fetching forum activity data for ${userDisplayName} (forum username: ${forum_username})`)
    const activityData = await fetchUserActivityFromDb({
        supabase,
        projectId,
        userId,
        dayDate,
        previousDays,
    })
    console.log(
        `🗓️ Processed ${activityData?.length || 0} activities for ${userDisplayName} (forum username: ${forum_username})`,
    )
    adapterLogs += `\nTotal API activities:  ${activityData?.length || 0}`

    if (!activityData || activityData.length === 0) {
        console.error(`No activity data found for ${userDisplayName} (forum username: ${forum_username})`)
        return
    }

    // Filter activity data to the activity range
    const activityRangeNewest = new Date(`${dayDate}T23:59:59.999Z`)
    const activityRangeOldest = new Date(
        new Date(activityRangeNewest).setDate(activityRangeNewest.getDate() - previousDays),
    )

    const filteredActivityData = activityData.filter((activity) => {
        const activityDate = new Date(activity.created_at)

        // Exclude auth post from the activity data
        return (
            activityDate > activityRangeOldest &&
            activityDate < activityRangeNewest &&
            Number(activity.postId) !== Number(userData.auth_post_id)
        )
    })

    console.log(`🗓️ Filtered activity data to the past ${previousDays} days: ${filteredActivityData.length}`)
    adapterLogs += `\nActivity past ${previousDays} days: ${filteredActivityData.length}`

    // Create an array of filteredActivityData that contains one element per day
    // starting from dayDate and going back previousDays
    const formattedDayDate = new Date(`${dayDate}T23:59:59.999Z`)

    const dailyActivityData = []
    for (let i = 0; i < previousDays; i++) {
        const date = new Date(new Date(formattedDayDate).setDate(formattedDayDate.getDate() - i))

        const activitiesForDay = filteredActivityData.filter((activity) => {
            const activityDate = new Date(activity.created_at)
            return activityDate.toISOString().split("T")[0] === date.toISOString().split("T")[0]
        })
        dailyActivityData.push({
            date: date.toISOString().split("T")[0],
            data: activitiesForDay,
        })
    }

    console.log(
        "🗓️ Number of days to analyze for raw score calculation:",
        dailyActivityData.filter((day) => day.data && day.data.length > 0).length,
    )
    adapterLogs += `\nUnique activity days: ${dailyActivityData.filter((day) => day.data && day.data.length > 0).length}\n`

    return { dailyActivityData, adapterLogs }
}

module.exports = { getDailyActivityData }
