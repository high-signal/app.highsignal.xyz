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

    // === Fetch activity data for Discord the DB for the range between dayDate and previousDays ===
    console.log(`👀 Fetching Discord activity data for ${userDisplayName} (Discord username: ${discordUsername})`)

    const activityRangeNewest = new Date(`${dayDate}T23:59:59.999Z`)
    const activityRangeOldest = new Date(
        new Date(activityRangeNewest).setDate(activityRangeNewest.getDate() - previousDays),
    )

    // Using pagination to ensure we get all messages in the range.
    let activityData = []
    let pageSize = 1000
    let currentPage = 0
    let hasMoreResults = true

    while (hasMoreResults) {
        const from = currentPage * pageSize
        const to = from + pageSize - 1

        const { data: pageData, error: pageError } = await supabase
            .from("discord_messages")
            .select("*")
            .eq("discord_user_id", discordUserId)
            .eq("guild_id", guildId)
            .gte("created_timestamp", activityRangeOldest.toISOString())
            .lte("created_timestamp", activityRangeNewest.toISOString())
            .order("created_timestamp", { ascending: false })
            .range(from, to)

        if (pageError) {
            console.error("Error fetching activity data:", pageError)
            throw pageError
        }

        if (pageData && pageData.length > 0) {
            activityData = activityData.concat(pageData)
            currentPage++

            // If we got fewer results than the page size, we have reached the end
            if (pageData.length < pageSize) {
                hasMoreResults = false
            }
        } else {
            hasMoreResults = false
        }
    }

    // TODO: Remove this filter once we have a way to handle messages with less
    // than 9 characters by not passing them to the AI and giving a fixed score.
    activityData = activityData.filter((activity) => activity.content && activity.content.length >= 9)

    console.log(
        `🗓️ Processed ${activityData?.length || 0} activities for ${userDisplayName} (Discord username: ${discordUsername})`,
    )

    // If no activity data is found, return an empty array and adapter logs.
    if (!activityData || activityData.length === 0) {
        console.log(`📭 No activity data found for ${userDisplayName} (Discord username: ${discordUsername})`)
        return { dailyActivityData: [], adapterLogs }
    }

    adapterLogs += `\nActivity past ${previousDays} days: ${activityData.length}`

    // Create an array of activityData that contains one element per day
    // starting from dayDate and going back previousDays
    const formattedDayDate = new Date(`${dayDate}T23:59:59.999Z`)

    // Group activities by date in a single pass (O(n) instead of O(n*m))
    const activitiesByDate = new Map()
    for (const activity of activityData) {
        const activityDate = new Date(activity.created_timestamp).toISOString().split("T")[0]
        if (!activitiesByDate.has(activityDate)) {
            activitiesByDate.set(activityDate, [])
        }
        activitiesByDate.get(activityDate).push({
            id: activity.message_id,
            created_timestamp: activity.created_timestamp,
            content: activity.content,
        })
    }

    // Build daily activity data by looking up pre-grouped activities (O(m))
    const dailyActivityData = []
    for (let i = 0; i < previousDays; i++) {
        const date = new Date(new Date(formattedDayDate).setDate(formattedDayDate.getDate() - i))
        const dateString = date.toISOString().split("T")[0]

        dailyActivityData.push({
            date: dateString,
            data: activitiesByDate.get(dateString) || [],
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
