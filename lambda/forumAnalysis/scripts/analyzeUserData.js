require("dotenv").config({ path: "../.env" })
const OpenAI = require("openai")
const { processObjectForHtml } = require("./processObjectForHtml")

// === CONFIG ===
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const MODEL = "gpt-4-1106-preview"

// === SETUP OPENAI ===
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

async function analyzeUserData(userData, username, displayName, maxValue, previousDays) {
    console.log("displayName", displayName)

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
        }
    }

    // === PROMPT ===
    const basePrompt = `
    You are an assistant reviewing user activity data. Evaluate the overall quality and tone of the user's contributions. The score doesn't have to be round numbers (5, 20, etc.) but should be whole numbers, it should be a gradient based on those criteria. Give the user a score from 0-${maxValue} with the following criteria:

    Criteria:
    - 0: Aggressive, spam, hostile, or scam content.
    - ${Math.floor(maxValue * 0.1)}: Low-quality one-liners like "thanks" or "cool".
    - ${Math.floor(maxValue * 0.3)}: Slightly better but still low-effort.
    - ${Math.floor(maxValue * 0.8)}: Decent, helpful or on-topic contributions.
    - ${maxValue}: Thoughtful, constructive, insightful, or detailed comments.

    If a user has a lot of high quality contributions, give them a score of ${maxValue}. Be slightly more generous than strict.

    IMPORTANT: You must respond with ONLY a valid JSON object. Do not include any other text, markdown formatting, or backticks. The response should start with { and end with }.

    The summary and description should only mention the user display name "${displayName}" not the username "${username}".
    The username "${username}" must be used as the key in the JSON object.

    The JSON object should have the username as the key, and the value should be an object containing:
    1. A short sentence describing the overall quality and tone of their activity (3-5 words)
    2. A short description of the user's activity (2-3 sentences)
    3. Improvement suggestions (1-2 sentences)
    4. A numeric score between 0 and ${maxValue} (not rounded). It must not have decimals.

    Example format:
    {
      "${username}": {
        "summary": "Provides detailed technical feedback",
        "description": "${displayName} is a great contributor to the community. They provide detailed technical feedback and constructive suggestions.",
        "improvements": "To improve their score, ${displayName} could ask more questions and provide more examples.",
        "value": ${Math.floor(maxValue * 0.6)}
      }
    }
    `

    // Process the userData to strip HTML
    const processedUserData = processObjectForHtml(userData)

    // Convert userData to a string representation
    const userDataString = JSON.stringify(processedUserData, null, 2)

    console.log("userDataString.length", userDataString.length)

    // TODO: Increase limit
    const truncatedData = userDataString.substring(0, 10000) + (userDataString.length > 10000 ? "..." : "")
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
            model: MODEL,
            messages,
            temperature: 0.2,
        })

        const response = res.choices[0].message.content.trim()
        console.log("Raw response:", response)

        // Try to clean the response if it has markdown backticks
        const cleanResponse = response.replace(/^```json\n?|\n?```$/g, "").trim()

        try {
            const results = JSON.parse(cleanResponse)

            // Return the results
            console.log("Analysis complete for user:", username)
            return results
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
