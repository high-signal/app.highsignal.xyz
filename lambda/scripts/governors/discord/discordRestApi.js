// Discord REST API implementation for Lambda functions
// This avoids the overhead of creating Discord.js clients for each Lambda invocation

const { MAX_REQUESTS_PER_SECOND_PER_CHANNEL } = require("./constants")

class DiscordRestApi {
    constructor() {
        this.baseUrl = "https://discord.com/api/v10"
        this.token = process.env.DISCORD_BOT_TOKEN
        this.requestTimestamps = new Map() // Track rate limits per channel
    }

    // Rate limiting helper
    async checkRateLimit(channelId) {
        const now = Date.now()
        if (!this.requestTimestamps.has(channelId)) {
            this.requestTimestamps.set(channelId, [])
        }

        const timestamps = this.requestTimestamps.get(channelId)
        const recentRequests = timestamps.filter((ts) => now - ts < 1000)

        if (recentRequests.length >= MAX_REQUESTS_PER_SECOND_PER_CHANNEL) {
            const waitTime = 1000 - (now - recentRequests[0])
            console.log(`⏳ Rate limit hit for channel ${channelId}, waiting ${waitTime}ms...`)
            await new Promise((resolve) => setTimeout(resolve, waitTime))
        }

        timestamps.push(Date.now())
        this.requestTimestamps.set(channelId, timestamps)
    }

    // Fetch messages from a channel
    async fetchMessages(channelId, options = {}) {
        await this.checkRateLimit(channelId)

        const params = new URLSearchParams()
        if (options.limit) params.append("limit", options.limit.toString())
        if (options.before) params.append("before", options.before)
        if (options.after) params.append("after", options.after)
        if (options.around) params.append("around", options.around)

        const url = `${this.baseUrl}/channels/${channelId}/messages?${params.toString()}`

        console.log("📡 DISCORD API CALL: fetchMessages")
        const response = await fetch(url, {
            headers: {
                Authorization: `Bot ${this.token}`,
                "Content-Type": "application/json",
            },
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Discord API error: ${response.status} ${response.statusText} - ${errorText}`)
        }

        return await response.json()
    }

    // Get guild roles
    async getGuildRoles(guildId) {
        console.log("📡 DISCORD API CALL: Get all guild roles")
        const response = await fetch(`${this.baseUrl}/guilds/${guildId}/roles`, {
            headers: {
                Authorization: `Bot ${this.token}`,
                "Content-Type": "application/json",
            },
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Discord API error: ${response.status} ${response.statusText} - ${errorText}`)
        }

        const allGuildRoles = await response.json()
        return allGuildRoles
    }

    // Get accessible text channels in a guild
    async getAccessibleTextChannels(guildId) {
        const TEXT_CHANNEL_TYPES = [0] // GuildText

        // Fetch all channels
        console.log("📡 DISCORD API CALL: Fetching all channels")
        const channelsRes = await fetch(`${this.baseUrl}/guilds/${guildId}/channels`, {
            headers: {
                Authorization: `Bot ${this.token}`,
                "Content-Type": "application/json",
            },
        })
        if (!channelsRes.ok) {
            const errorText = await channelsRes.text()
            throw new Error(`Discord API error: ${channelsRes.status} ${channelsRes.statusText} - ${errorText}`)
        }
        const allChannels = await channelsRes.json()

        // Fetch all roles
        const roles = await this.getGuildRoles(guildId)
        const roleMap = new Map(roles.map((r) => [r.id, BigInt(r.permissions)]))

        // Get bot user and their member roles
        const botUserId = process.env.DISCORD_BOT_USER_ID
        console.log("📡 DISCORD API CALL: Get bot member roles")
        const memberRes = await fetch(`${this.baseUrl}/guilds/${guildId}/members/${botUserId}`, {
            headers: {
                Authorization: `Bot ${this.token}`,
                "Content-Type": "application/json",
            },
        })
        if (!memberRes.ok) {
            const errorText = await memberRes.text()
            throw new Error(`Discord API error: ${memberRes.status} ${memberRes.statusText} - ${errorText}`)
        }
        const botMember = await memberRes.json()
        const botRoleIds = botMember.roles

        // Compute base permissions from @everyone + bot roles
        const everyoneRoleId = guildId
        let basePerms = roleMap.get(everyoneRoleId) || 0n
        for (const id of botRoleIds) {
            const perms = roleMap.get(id)
            if (perms) basePerms |= perms
        }

        // Filter only readable channels
        const readable = allChannels.filter((channel) => {
            if (!TEXT_CHANNEL_TYPES.includes(channel.type)) return false

            let allow = 0n
            let deny = 0n

            for (const ow of channel.permission_overwrites || []) {
                const targetId = ow.id
                const type = ow.type // 0 = role, 1 = member

                if (type === 0 && (targetId === everyoneRoleId || botRoleIds.includes(targetId))) {
                    allow |= BigInt(ow.allow)
                    deny |= BigInt(ow.deny)
                } else if (type === 1 && targetId === botUserId) {
                    allow |= BigInt(ow.allow)
                    deny |= BigInt(ow.deny)
                }
            }

            const finalPerms = (basePerms & ~deny) | allow
            return (finalPerms & (1n << 10n)) !== 0n // 1 << 10 = VIEW_CHANNEL
        })

        return readable
    }
}

module.exports = { DiscordRestApi }
