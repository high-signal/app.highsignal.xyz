async function getDailyActivityData({
    supabase,
    userDisplayName,
    signalStrengthUsername,
    signalStrengthConfig,
    dayDate,
}) {
    let adapterLogs = ""
    const discordUsername = signalStrengthUsername
    const previousDays = signalStrengthConfig.previous_days
    const url = signalStrengthConfig.url

    // Extract guild ID from the Discord URL.
    const urlMatch = url.match(/discord\.com\/channels\/(\d+)/)
    const guildId = urlMatch[1]

    // ======================
    // Get user data from DB
    // ======================
    const { data: userData, error: userError } = await supabase
        .from("users")
        .select("discord_username, discord_user_id")
        .eq("discord_username", discordUsername)
        .single()

    if (userError) {
        console.error("Error fetching user data:", userError)
        throw userError
    }

    const discordUserId = userData.discord_user_id

    // === Fetch activity data for Discord the DB for the previous days ===
    console.log(`👀 Fetching Discord activity data for ${userDisplayName} (Discord username: ${discordUsername})`)

    const cutoffDate = new Date(`${dayDate}T00:00:00.000Z`)
    cutoffDate.setDate(cutoffDate.getDate() - previousDays)

    const { data: activityData, error: activityError } = await supabase
        .from("discord_messages")
        .select("*")
        .eq("discord_user_id", discordUserId)
        .eq("guild_id", guildId)
        .gte("created_timestamp", cutoffDate.toISOString())
        .order("created_timestamp", { ascending: false })

    if (activityError) {
        console.error("Error fetching activity data:", activityError)
        throw activityError
    }

    console.log(
        `🗓️ Processed ${activityData?.length || 0} activities for ${userDisplayName} (Discord username: ${discordUsername})`,
    )

    // If no activity data is found, return an empty array and adapter logs.
    if (!activityData || activityData.length === 0) {
        console.error(`No activity data found for ${userDisplayName} (Discord username: ${discordUsername})`)
        return { dailyActivityData: [], adapterLogs }
    }

    adapterLogs += `\nActivity past ${previousDays} days: ${activityData.length}`

    // Create an array of activityData that contains one element per day
    // starting from dayDate and going back previousDays
    const formattedDayDate = new Date(`${dayDate}T00:00:00.000Z`)

    const dailyActivityData = []
    for (let i = 0; i < previousDays; i++) {
        const date = new Date(new Date(formattedDayDate).setDate(formattedDayDate.getDate() - i))

        const activitiesForDay = activityData
            .filter((activity) => {
                const activityDate = new Date(activity.created_timestamp)
                return activityDate.toISOString().split("T")[0] === date.toISOString().split("T")[0]
            })
            .map((activity) => ({
                created_timestamp: activity.created_timestamp,
                content: activity.content,
            }))
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
