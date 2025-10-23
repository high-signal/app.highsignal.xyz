const { runRefreshUserProjectScores } = require("../utils/runRefreshUserProjectScores")

async function handleRunRefreshUserProjectScores() {
    try {
        await runRefreshUserProjectScores()
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Refresh user project scores completed successfully" }),
        }
    } catch (error) {
        console.error("Error in runRefreshUserProjectScores:", error)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error running refresh user project scores" }),
        }
    }
}

module.exports = {
    handleRunRefreshUserProjectScores,
}
