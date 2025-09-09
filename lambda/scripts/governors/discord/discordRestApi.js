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
        // Clean up old timestamps (older than 1 second)
        const cutoffTime = now - 1000
        const validTimestamps = timestamps.filter((ts) => ts > cutoffTime)

        // Update the map with cleaned timestamps
        this.requestTimestamps.set(channelId, validTimestamps)

        console.log(
            `|  🐌 Rate limit check for channel ${channelId}: ${validTimestamps.length}/${MAX_REQUESTS_PER_SECOND_PER_CHANNEL} requests in last 1s (${new Date(now).toISOString()})`,
        )

        // Check if we're at the rate limit
        if (validTimestamps.length >= MAX_REQUESTS_PER_SECOND_PER_CHANNEL) {
            // Wait until the oldest request is more than 1 second old
            const oldestRequest = Math.min(...validTimestamps)
            const waitTime = 1000 - (now - oldestRequest) + 1 // Add 1ms buffer
            console.log(
                `⏳ Rate limit hit for channel ${channelId}, waiting ${waitTime}ms... (${new Date(now).toISOString()})`,
            )
            await new Promise((resolve) => setTimeout(resolve, waitTime))
            const afterWait = Date.now()
            console.log(
                `✅ Rate limit wait completed for channel ${channelId} (${new Date(afterWait).toISOString()}, actual wait: ${afterWait - now}ms)`,
            )
        }

        // Add current timestamp
        validTimestamps.push(Date.now())
        this.requestTimestamps.set(channelId, validTimestamps)
    }

    // Reusable retry function for Discord API calls
    async makeDiscordRequest(url, options = {}, retryCount = 0) {
        const MAX_RETRIES = 3

        const response = await fetch(url, {
            headers: {
                Authorization: `Bot ${this.token}`,
                "Content-Type": "application/json",
                ...options.headers,
            },
            ...options,
        })

        if (response.status === 429) {
            // Handle Discord's rate limiting
            const errorData = await response.json()
            const retryAfter = errorData.retry_after * 1000 // Convert to milliseconds
            const isGlobal = errorData.global || false

            console.log(
                `|  🚫 Discord rate limit hit: ${isGlobal ? "global" : "endpoint"} limit, waiting ${retryAfter}ms...`,
            )
            await new Promise((resolve) => setTimeout(resolve, retryAfter))

            // Retry the request after waiting
            console.log("|  🔄 Retrying Discord API call after rate limit wait...")
            return await this.makeDiscordRequest(url, options, retryCount)
        }

        if (response.status >= 500 && response.status < 600) {
            // Handle server errors (5xx)
            if (retryCount < MAX_RETRIES) {
                const waitTime = Math.pow(2, retryCount) * 1000 // Exponential backoff: 1s, 2s, 4s
                console.log(
                    `|  ⚠️ Server error ${response.status}, retrying in ${waitTime}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`,
                )
                await new Promise((resolve) => setTimeout(resolve, waitTime))
                return await this.makeDiscordRequest(url, options, retryCount + 1)
            } else {
                console.log(`|  ❌ Max retries (${MAX_RETRIES}) reached for server error ${response.status}`)
            }
        }

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(
                `Discord API error for URL ${url}: ${response.status} ${response.statusText} - ${errorText}`,
            )
        }

        return await response.json()
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

        console.log("|  📡 DISCORD API CALL: fetchMessages")
        return await this.makeDiscordRequest(url)
    }

    // Get guild roles
    async getGuildRoles(guildId) {
        console.log("📡 DISCORD API CALL: Get all guild roles")
        const url = `${this.baseUrl}/guilds/${guildId}/roles`
        return await this.makeDiscordRequest(url)
    }

    // Get accessible text channels in a guild
    async getAccessibleTextChannels(guildId) {
        const TEXT_CHANNEL_TYPES = [0] // GuildText

        // Fetch all channels
        console.log("📡 DISCORD API CALL: Fetching all channels")
        const channelsUrl = `${this.baseUrl}/guilds/${guildId}/channels`
        const allChannels = await this.makeDiscordRequest(channelsUrl)

        // Fetch all roles
        const roles = await this.getGuildRoles(guildId)
        const roleMap = new Map(roles.map((r) => [r.id, BigInt(r.permissions)]))

        // Get bot user and their member roles
        const botUserId = process.env.DISCORD_BOT_USER_ID
        console.log("📡 DISCORD API CALL: Get bot member roles")
        const memberUrl = `${this.baseUrl}/guilds/${guildId}/members/${botUserId}`
        const botMember = await this.makeDiscordRequest(memberUrl)
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

    // Get visible active threads
    async getVisibleActiveThreads(guildId) {
        console.log("📡 DISCORD API CALL: Get all visible active threads")
        const url = `${this.baseUrl}/guilds/${guildId}/threads/active`
        return await this.makeDiscordRequest(url)
    }
}

module.exports = { DiscordRestApi }
