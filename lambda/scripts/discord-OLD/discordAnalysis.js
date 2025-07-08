// fetch-messages.js
require("dotenv").config({ path: "../../../.env" })
const { Client, GatewayIntentBits, Partials } = require("discord.js")

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // connect to guilds
        GatewayIntentBits.GuildMessages, // read messages
        GatewayIntentBits.MessageContent, // read message content
    ],
    partials: [Partials.Channel],
})

client.once("ready", () => {
    console.log(`✅ Logged in as bot user: ${client.user.tag}`)

    // Fetch messages after bot is ready
    fetchMessages()
})

async function fetchMessages() {
    try {
        const guildId = "1386983762394615859";
        const guild = await client.guilds.fetch(guildId);
        await guild.channels.fetch(); // Populate the channel cache

        console.log(`📦 Fetching messages from all visible text channels in "${guild.name}":`);

        const textChannels = guild.channels.cache.filter(
            (channel) => channel.isTextBased() && channel.viewable
        );

        for (const channel of textChannels.values()) {
            console.log(`\n#️⃣ Channel: #${channel.name} (ID: ${channel.id})`);

            try {
                const messages = await channel.messages.fetch({ limit: 100 });

                console.log(`📝 ${messages.size} messages fetched from #${channel.name}`);

                messages.forEach((msg) => {
                    console.log(`[${msg.createdAt.toISOString()}] ${msg.author.username}: ${msg.content}`);
                });

            } catch (fetchErr) {
                console.warn(`⚠️ Could not fetch messages for #${channel.name}:`, fetchErr.message);
            }

            // Optional: pause to respect rate limits
            await new Promise((r) => setTimeout(r, 300));
        }

    } catch (err) {
        console.error("❌ Error fetching channels or messages:", err);
    } finally {
        await client.destroy() // cleanly disconnect from Discord gateway
        process.exit(0) // exit the script
    }
}

// Start the bot
client.login(process.env.DISCORD_BOT_TOKEN)
