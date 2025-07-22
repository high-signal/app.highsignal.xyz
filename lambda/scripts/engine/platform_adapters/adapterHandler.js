const discourseForum = require("./discourse_forum/discourseForum")
const discord = require("./discord/discord")

async function getDailyActivityData({
    supabase,
    userId,
    userDisplayName,
    projectId,
    signalStrengthName,
    signalStrengthUsername,
    signalStrengthConfig,
}) {
    if (signalStrengthName === "discourse_forum") {
        const { dailyActivityData, adapterLogs } = await discourseForum.getDailyActivityData({
            supabase,
            userId,
            userDisplayName,
            projectId,
            signalStrengthUsername,
            signalStrengthConfig,
        })

        return { dailyActivityData, adapterLogs }
    } else if (signalStrengthName === "discord") {
        const { dailyActivityData, adapterLogs } = await discord.getDailyActivityData({
            supabase,
            userDisplayName,
            signalStrengthUsername,
            signalStrengthConfig,
        })
        return { dailyActivityData, adapterLogs }
    } else {
        throw new Error(`Unsupported signal strength name: ${signalStrengthName}`)
    }
}

module.exports = { getDailyActivityData }
