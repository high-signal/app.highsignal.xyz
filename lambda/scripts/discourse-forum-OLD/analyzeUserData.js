require("dotenv").config({ path: "../.env" })
const OpenAI = require("openai")
const { processObjectForHtml } = require("./processObjectForHtml")
const { calculateSmartScore } = require("./calculateSmartScores")

// === CONFIG ===
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// === SETUP OPENAI ===
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

async function analyzeUserData(
    signalStrengthData,
    userData,
    username,
    displayName, // Used in the evaluation of the prompt
    maxValue, // Used in the evaluation of the prompt
    previousDays,
    testingData,
    dayDate,
    type,
    logs = "",
) {
    console.log(`Day ${dayDate} analysis started...`)

    let promptId

    // Returns -2, -1, 0, 1, or 2 with equal probability
    const randomVariation = Math.floor(Math.random() * 5) - 2

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

    console.log("model", model)

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
        basePrompt = eval("`" + rawTestingInputData.testingPrompt + "`")
    } else if (type === "smart" && smartTestingInputData?.testingPrompt) {
        basePrompt = eval("`" + smartTestingInputData.testingPrompt + "`")
    } else if (signalStrengthData.prompts.find((prompt) => prompt.type === type)) {
        // TODO: For now it just gets the latest prompt for the type
        // but in future it should get the prompt for the date so that history is consistent
        // e.g. if a user disconnects and reconnects their forum account, the prompt used to calculate
        // their previous days raw scores should be the same each time
        const promptData = signalStrengthData.prompts
            .filter((prompt) => prompt.type === type)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]

        promptId = promptData.id
        basePrompt = eval("`" + promptData.prompt + "`")
    } else {
        return { error: "No prompt set in DB" }
    }

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
        console.log(`** No activity in the past ${previousDays} days **`)
        return {
            [username]: {
                summary: `No activity in the past ${previousDays} days`,
                description: null,
                improvements: null,
                value: 0,
            },
            created: Math.floor(Date.now() / 1000),
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
            content: `${basePrompt}\n\nUser Data for ${username}:\n${truncatedData}`,
        },
    ]

    try {
        console.log("Making OpenAI API call...")
        const res = await openai.chat.completions.create({
            model: model,
            messages,
            temperature: Number(temperature),
        })

        // console.log("res", res)

        const analysisLogs = `${logs ? logs + "\n" : ""}userDataString.length: ${userDataString.length}
truncatedData.length: ${truncatedData.length}
`

        const response = res.choices[0].message.content.trim()
        // console.log("Raw response:", response)

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
                ...JSON.parse(cleanResponse),
            }

            if (type === "smart") {
                const smartScore = calculateSmartScore(userData, previousDays)
                responseWithDataAdded[username].value = smartScore
            }

            // Return the results
            console.log("Analysis complete for user:", username)
            return responseWithDataAdded
        } catch (parseError) {
            console.error("Failed to parse JSON response:", parseError.message)
            console.error("Cleaned response:", cleanResponse)
            return { error: "Failed to parse analysis results" }
        }
    } catch (err) {
        console.error("Error analyzing user data:", err.message)
        return { error: "Failed to analyze user data" }
    }
}

module.exports = { analyzeUserData }
