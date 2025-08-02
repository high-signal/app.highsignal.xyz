const { runForumGovernor } = require("../governors/forum/runForumGovernor")

async function handleRunForumGovernor() {
    try {
        await runForumGovernor()
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Forum Governor completed successfully" }),
        }
    } catch (error) {
        console.error("Error in runForumGovernor:", error)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error running forum governor" }),
        }
    }
}

module.exports = {
    handleRunForumGovernor,
}
