require("dotenv").config({ path: "../.env" })

const { Parser } = require("expr-eval")

const OpenAI = require("openai")
const { processObjectForHtml } = require("../utils/processObjectForHtml")
const { calculateSmartScore } = require("./calculateSmartScores")

// === CONFIG ===
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// === SETUP OPENAI ===
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

async function analyzeUserData({
    signalStrengthData,
    userData,
    userDisplayName,
    signalStrengthUsername,
    maxValue,
    previousDays,
    testingData,
    dayDate,
    type,
    logs = "",
}) {
    console.log(
        `⏳ ${type === "smart" ? "Smart" : "Raw"} score for ${userDisplayName} (signalStrengthUsername: ${signalStrengthUsername}) on ${dayDate} analysis started...`,
    )

    let calculatedSmartScore
    if (type === "smart") {
        const smartScoreResult = calculateSmartScore(userData, previousDays, maxValue)
        calculatedSmartScore = smartScoreResult.smartScore
        const topBandDays = smartScoreResult.topBandDays

        // Filter userData to only include the days that were used in the smart score calculation
        if (topBandDays.length > 0) {
            userData = userData.filter((d) => topBandDays.includes(d.day))
        }
    }

    let promptId

    const rawTestingInputData = testingData?.testingInputData?.rawTestingInputData
    const smartTestingInputData = testingData?.testingInputData?.smartTestingInputData

    let model
    if (type === "raw" && rawTestingInputData?.testingModel) {
        model = rawTestingInputData.testingModel
    } else if (type === "smart" && smartTestingInputData?.testingModel) {
        model = smartTestingInputData.testingModel
    } else if (signalStrengthData.model) {
        model = signalStrengthData.model
    } else {
        return { error: "No model set in DB" }
    }

    console.log(
        `🤖 Using model: ${model}. ${type === "smart" ? "Smart" : "Raw"} score for user: ${signalStrengthUsername} on ${dayDate}...`,
    )

    let temperature
    if (type === "raw" && rawTestingInputData?.testingTemperature) {
        temperature = rawTestingInputData.testingTemperature
    } else if (type === "smart" && smartTestingInputData?.testingTemperature) {
        temperature = smartTestingInputData.testingTemperature
    } else if (signalStrengthData.temperature) {
        temperature = signalStrengthData.temperature
    } else {
        return { error: "No temperature set in DB" }
    }

    let basePrompt
    if (type === "raw" && rawTestingInputData?.testingPrompt) {
        basePrompt = rawTestingInputData.testingPrompt
    } else if (type === "smart" && smartTestingInputData?.testingPrompt) {
        basePrompt = smartTestingInputData.testingPrompt
    } else if (signalStrengthData.prompts.find((prompt) => prompt.type === type)) {
        const promptData = signalStrengthData.prompts
            .filter((prompt) => prompt.type === type)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]

        promptId = promptData.id
        basePrompt = promptData.prompt
    } else {
        return { error: "No prompt set in DB" }
    }

    const evaluatedBasePrompt = _evaluatePrompt(basePrompt, {
        signalStrengthUsername,
        maxValue,
        dayDate,
        floor: Math.floor, // Expose math floor function
    })

    let maxChars
    if (type === "raw" && rawTestingInputData?.testingMaxChars) {
        maxChars = rawTestingInputData.testingMaxChars
    } else if (type === "smart" && smartTestingInputData?.testingMaxChars) {
        maxChars = smartTestingInputData.testingMaxChars
    } else if (signalStrengthData.max_chars) {
        maxChars = signalStrengthData.max_chars
    } else {
        return { error: "No max_chars set in DB" }
    }

    // If filteredActivityData is empty, return null
    if (userData.length === 0) {
        console.log(`⚠️ No activity in the past ${previousDays} days`)
        return {
            [signalStrengthUsername]: {
                summary: `No activity in the past ${previousDays} days`,
                description: null,
                improvements: null,
                value: 0,
            },
            created: Math.floor(Date.now() / 1000),
            previousDays: previousDays,
        }
    }

    // Process the userData to strip HTML
    const processedUserData = processObjectForHtml(userData)

    // Convert userData to a string representation
    const userDataString = JSON.stringify(processedUserData, null, 2)

    // console.log("userDataString.length", userDataString.length)

    const truncatedData = userDataString.substring(0, maxChars - 3) + (userDataString.length > maxChars ? "..." : "")
    // console.log(`Using truncated data (${truncatedData.length} chars) for testing`)

    const messages = [
        {
            role: "system",
            content:
                "You are a helpful assistant that evaluates user activity data. You must respond with only valid JSON.",
        },
        {
            role: "user",
            content: `${evaluatedBasePrompt}\n\nUser Data for ${signalStrengthUsername}:\n${truncatedData}`,
        },
    ]

    try {
        console.log(
            `🤖 Making OpenAI API call. ${type === "smart" ? "Smart" : "Raw"} score for user: ${signalStrengthUsername} on ${dayDate}...`,
        )
        const res = await openai.chat.completions.create({
            model: model,
            messages,
            temperature: Number(temperature),
        })

        const analysisLogs = `${logs ? logs + "\n" : ""}userDataString.length: ${userDataString.length}
truncatedData.length: ${truncatedData.length}
`

        const response = res.choices[0].message.content.trim()

        // Try to clean the response if it has markdown backticks
        const cleanResponse = response.replace(/^```json\n?|\n?```$/g, "").trim()

        try {
            // Add the prompt and model to the response
            const responseWithDataAdded = {
                requestId: res.id,
                created: res.created,
                promptTokens: res.usage.prompt_tokens,
                completionTokens: res.usage.completion_tokens,
                logs: analysisLogs,
                model: model,
                temperature: temperature,
                promptId: promptId,
                maxChars: maxChars,
                previousDays: previousDays,
                ...JSON.parse(cleanResponse),
            }

            if (calculatedSmartScore) {
                responseWithDataAdded[signalStrengthUsername].value = calculatedSmartScore
            }

            // Return the results
            console.log(
                `🤖 ${type === "smart" ? "Smart" : "Raw"} analysis complete for user: ${signalStrengthUsername} on ${dayDate}`,
            )
            return responseWithDataAdded
        } catch (parseError) {
            const errorMessage = `Failed to parse JSON response: ${parseError.message}`
            console.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        const errorMessage = `Error analyzing user data: ${err.message}`
        console.error(errorMessage)
        throw new Error(errorMessage)
    }
}

function _evaluatePrompt(prompt, data) {
    const parser = new Parser()
    return prompt.replace(/\$\{([^}]+)\}/g, (_, expr) => {
        try {
            const parsed = parser.parse(expr)
            return parsed.evaluate(data)
        } catch (err) {
            return ""
        }
    })
}

module.exports = { analyzeUserData }
