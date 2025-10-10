const { runShellUserGovernor } = require("../governors/shell-users/runShellUserGovernor")

async function handleRunShellUserGovernor() {
    try {
        await runShellUserGovernor()
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Shell User Governor completed successfully" }),
        }
    } catch (error) {
        console.error("Error in runShellUserGovernor:", error)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error running Shell User Governor" }),
        }
    }
}

module.exports = {
    handleRunShellUserGovernor,
}
