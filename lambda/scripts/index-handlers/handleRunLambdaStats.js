const { runLambdaStats } = require("../stats/runLambdaStats")

async function handleRunLambdaStats() {
    try {
        await runLambdaStats()
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Lambda stats completed successfully" }),
        }
    } catch (error) {
        console.error("Error in runLambdaStats:", error)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error running Lambda stats" }),
        }
    }
}

module.exports = {
    handleRunLambdaStats,
}
