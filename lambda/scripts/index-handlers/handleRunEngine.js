const { runEngine } = require("../engine/runEngine")

async function handleRunEngine(params) {
    const { signalStrengthName, userId, projectId, signalStrengthUsername, dayDate, testingData } = params

    // Validate required parameters for runEngine
    if (!signalStrengthName || !userId || !projectId || !signalStrengthUsername) {
        console.log(
            `Missing required parameters for runEngine: signalStrengthName: ${signalStrengthName}, userId: ${userId}, projectId: ${projectId}, signalStrengthUsername: ${signalStrengthUsername}`,
        )
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing required parameters for runEngine" }),
        }
    }

    // Process the request based on the signal strength name
    if (signalStrengthName === "discourse_forum" || signalStrengthName === "discord") {
        await runEngine({
            signalStrengthName,
            userId,
            projectId,
            signalStrengthUsername,
            dayDate,
            testingData,
        })
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Analysis completed successfully" }),
        }
    } else {
        console.log(`Signal strength (${signalStrengthName}) not configured for updates`)
        return {
            statusCode: 400,
            body: JSON.stringify({ error: `Signal strength (${signalStrengthName}) not configured for updates` }),
        }
    }
}

module.exports = {
    handleRunEngine,
}
