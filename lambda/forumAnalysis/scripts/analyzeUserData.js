require("dotenv").config({ path: "../.env" })
const OpenAI = require("openai")
const { processObjectForHtml } = require("./processObjectForHtml")

// === CONFIG ===
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// === SETUP OPENAI ===
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

async function analyzeUserData(
    signalStrengthData,
    userData,
    username,
    displayName,
    maxValue, // Used in the evaluation of the prompt
    previousDays,
    testingData,
) {
    console.log("displayName", displayName)

    let model
    if (testingData && testingData.testingModel) {
        model = testingData.testingModel
    } else if (signalStrengthData.model) {
        model = signalStrengthData.model
    } else {
        return { error: "No model set in DB" }
    }

    let temperature
    if (testingData && testingData.testingTemperature !== undefined) {
        temperature = testingData.testingTemperature
    } else if (signalStrengthData.temperature) {
        temperature = signalStrengthData.temperature
    } else {
        return { error: "No temperature set in DB" }
    }

    let basePrompt
    if (testingData && testingData.testingPrompt) {
        basePrompt = eval("`" + testingData.testingPrompt + "`")
    } else if (signalStrengthData.prompts.prompt) {
        basePrompt = eval("`" + signalStrengthData.prompts.prompt + "`")
    } else {
        return { error: "No prompt set in DB" }
    }

    let maxChars
    if (testingData && testingData.testingMaxChars) {
        maxChars = testingData.testingMaxChars
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

    console.log("userDataString.length", userDataString.length)

    const truncatedData = userDataString.substring(0, maxChars - 3) + (userDataString.length > maxChars ? "..." : "")
    console.log(`Using truncated data (${truncatedData.length} chars) for testing`)

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
            temperature: temperature,
        })

        console.log("res", res)

        const logs = `forumUsername: ${username}
userDataString.length: ${userDataString.length}
truncatedData.length: ${truncatedData.length}
`

        const response = res.choices[0].message.content.trim()
        console.log("Raw response:", response)

        // Try to clean the response if it has markdown backticks
        const cleanResponse = response.replace(/^```json\n?|\n?```$/g, "").trim()

        try {
            // Add the prompt and model to the response
            const responseWithDataAdded = {
                requestId: res.id,
                created: res.created,
                promptTokens: res.usage.prompt_tokens,
                completionTokens: res.usage.completion_tokens,
                logs: logs,
                model: model,
                temperature: temperature,
                promptId: signalStrengthData.prompt_id,
                maxChars: maxChars,
                ...JSON.parse(cleanResponse),
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
