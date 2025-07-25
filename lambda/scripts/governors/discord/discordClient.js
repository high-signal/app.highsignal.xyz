const { Client, GatewayIntentBits, Partials } = require("discord.js")

async function createReadyDiscordClient() {
    const client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
        partials: [Partials.Channel],
    })

    await new Promise((resolve, reject) => {
        client.once("error", (error) => {
            console.error("Discord client error:", error)
            reject(error)
        })
        client.once("ready", async () => {
            console.log(`🤖 Logged in as bot user: ${client.user.tag}`)
            resolve()
        })
        client.login(process.env.DISCORD_BOT_TOKEN).catch(reject)
    })
    return client
}

module.exports = { createReadyDiscordClient }
