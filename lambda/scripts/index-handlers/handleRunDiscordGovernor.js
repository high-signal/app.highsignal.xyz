const { runDiscordGovernor } = require("../governors/discord/runDiscordGovernor")

async function handleRunDiscordGovernor() {
    try {
        await runDiscordGovernor()
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Discord Governor completed successfully" }),
        }
    } catch (error) {
        console.error("Error in runDiscordGovernor:", error)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error running governor" }),
        }
    }
}

module.exports = {
    handleRunDiscordGovernor,
}
