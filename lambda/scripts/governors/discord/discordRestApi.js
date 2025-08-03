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

    // Get guild information
    async getGuild(guildId) {
        const url = `${this.baseUrl}/guilds/${guildId}`

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

    // Get guild channels
    async getGuildChannels(guildId) {
        const url = `${this.baseUrl}/guilds/${guildId}/channels`

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

    // Get bot user information
    async getCurrentUser() {
        const url = `${this.baseUrl}/users/@me`

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

    // Check if bot has permission to view a channel
    async canViewChannel(guildId, channelId) {
        try {
            // Get guild member (bot) permissions
            const botUser = await this.getCurrentUser()
            const url = `${this.baseUrl}/guilds/${guildId}/members/${botUser.id}`

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bot ${this.token}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                return false // Bot is not a member of the guild
            }

            const member = await response.json()

            // Get channel information to check permissions
            const channelUrl = `${this.baseUrl}/channels/${channelId}`
            const channelResponse = await fetch(channelUrl, {
                headers: {
                    Authorization: `Bot ${this.token}`,
                    "Content-Type": "application/json",
                },
            })

            if (!channelResponse.ok) {
                return false // Cannot access channel
            }

            const channel = await channelResponse.json()

            // Check if it's a text channel (type 0)
            if (channel.type !== 0) {
                return false
            }

            // For now, if we can fetch the channel info, we assume we have view permissions
            // In a more sophisticated implementation, you'd calculate permissions based on roles
            return true
        } catch (error) {
            console.error(`Error checking channel permissions: ${error.message}`)
            return false
        }
    }
}

module.exports = { DiscordRestApi }
