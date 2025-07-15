/**
 * @file This file defines the AIOrchestrator class, the central component of the Lambda Engine
 * responsible for coordinating the entire AI-driven scoring process. It is a pure, state-free module
 * that does not perform any database writes, ensuring testability and separation of concerns.
 *
 * The orchestrator's primary responsibilities include:
 * 1.  Fetching dynamic AI configurations (prompts, models, etc.) from the database.
 * 2.  Aggregating and preparing user-generated content from various platforms.
 * 3.  Constructing precise prompts based on templates and dynamic data.
 * 4.  Invoking the AI service to generate scores and qualitative assessments.
 * 5.  Transforming the AI service's output into the structured `UserSignalStrength` format,
 *     ready for insertion into the database by the `aiProcessor`.
 * 6.  Handling both 'raw' scores (based on daily activity) and 'smart' scores (meta-analysis of raw scores).
 */

import { SupabaseClient } from "@supabase/supabase-js"
import {
    AiConfig,
    AIScoreOutput,
    ForumUser,
    IAiOrchestrator,
    ModelConfig,
    PlatformOutput,
    Prompt,
    RawScore,
    RawScoreGenerationResult,
    SmartScoreOutput,
    UserSignalStrength,
} from "@shared/types"
import { getLegacySignalConfig, getUsersByIds } from "@shared/db"
import { AppConfig } from "./config"
import { Logger } from "./logger"
import { getAIServiceClient } from "./aiService"
import { calculateSmartScore } from "@shared/utils/smartScoreCalculator"
import { processObjectForHtml } from "@shared/utils/htmlStripper"

/**
 * Orchestrates the AI scoring process by coordinating database fetches,
 * prompt engineering, and AI service calls.
 */
export class AIOrchestrator implements IAiOrchestrator {
    private logger: Logger
    private appConfig: AppConfig
    private supabase: SupabaseClient

    /**
     * @param appConfig The application configuration.
     * @param logger The shared logger instance.
     * @param supabase The Supabase client for database interactions.
     */
    constructor(appConfig: AppConfig, logger: Logger, supabase: SupabaseClient) {
        this.appConfig = appConfig
        this.logger = logger
        this.supabase = supabase
    }

    /**
     * Generates a 'raw' score for a specific day of user activity.
     * This involves fetching the correct prompt, preparing the user content (stripping HTML, truncating),
     * calling the AI service, and transforming the output into the required format.
     *
     * @param user The user being scored.
     * @param day The specific day (YYYY-MM-DD) of the activity.
     * @param content A stringified representation of the user's actions for that day.
     * @param logs Any pre-existing logs to be included in the final record.
     * @param signalConfig The AI configuration for this scoring task.
     * @param projectId The project context.
     * @returns A `UserSignalStrength` object or `null` if scoring fails.
     */
    public async generateRawScores(
        user: ForumUser,
        day: string,
        content: string,
        logs: string,
        signalConfig: AiConfig,
        projectId: string,
    ): Promise<UserSignalStrength | null> {
        // Step 1: Validate and retrieve the appropriate prompt configuration.
        const promptConfig = this._prepareAndValidatePrompts(signalConfig, "raw")
        if (!promptConfig) {
            this.logger.error("Could not get valid prompt for raw score. Aborting.", {
                signalStrengthId: signalConfig.signalStrengthId,
                projectId,
            })
            return null
        }

        // Step 2: Prepare user content by stripping HTML and truncating it.
        const { username, displayName } = this._getUserIdentity(user, undefined)
        const dailyActions = JSON.parse(content)
        const strippedContent = processObjectForHtml(dailyActions)
        const truncatedContent = this._truncateContent(strippedContent, signalConfig.maxChars)

        // Step 3: Construct the final prompt.
        const prompt = this._preparePrompt(promptConfig.prompt!, {
            content: truncatedContent,
            username,
            displayName,
            maxValue: signalConfig.maxValue,
            logs,
        })

        // Step 4: Execute the AI service call.
        const aiScore = await this._executeAIServiceCall(prompt, signalConfig, user.user_id)
        if (!aiScore) {
            return null
        }

        // Step 5: Transform the AI output into the final UserSignalStrength format.
        return this._transformScoreOutput(aiScore, user.user_id, projectId, signalConfig, promptConfig.id, "raw", {
            day,
            logs,
        })
    }

    /**
     * Generates a single 'smart' score based on a user's recent raw scores.
     * This method first calculates a numeric score deterministically, then calls the AI for a qualitative summary.
     *
     * @param user The user being scored.
     * @param rawScores An array of the user's recent raw scores.
     * @param signalConfig The AI configuration for this scoring task.
     * @param projectId The project context.
     * @returns A `UserSignalStrength` object or null on failure.
     */
    public async generateSmartScoreSummary(
        user: ForumUser,
        rawScores: RawScore[],
        signalConfig: AiConfig,
        projectId: string,
    ): Promise<UserSignalStrength | null> {
        // Step 1: Validate and retrieve the appropriate prompt configuration.
        const promptConfig = this._prepareAndValidatePrompts(signalConfig, "smart")
        if (!promptConfig) {
            this.logger.error("Could not get valid prompt for smart score. Aborting.", {
                signalStrengthId: signalConfig.signalStrengthId,
                projectId,
            })
            return null
        }

        // Step 2: Calculate the deterministic smart score.
        const { smartScore, topBandDays } = calculateSmartScore(rawScores, signalConfig.previous_days ?? 30)

        // Step 3: Filter raw scores to only include those in the top band for the AI summary.
        const relevantRawScores = rawScores.filter((score) => topBandDays.includes(score.day))

        // Step 4: Prepare the prompt for the AI summary.
        const { username, displayName } = this._getUserIdentity(user, undefined)
        const prompt = this._prepareSmartScorePrompt(promptConfig.prompt!, {
            username,
            displayName,
            rawScores: JSON.stringify(relevantRawScores, null, 2),
            smartScore,
        })

        // Step 5: Execute the AI service call for the summary.
        const aiSummary = await this._executeAIServiceCall(prompt, signalConfig, user.user_id)
        if (!aiSummary) {
            return null
        }

        // Step 6: Transform the output into the final UserSignalStrength format.
        return this._transformScoreOutput(aiSummary, user.user_id, projectId, signalConfig, promptConfig.id, "smart", {
            numericScore: smartScore,
        })
    }

    /**
     * Fetches, validates, and selects the most recent, valid prompt of a given type.
     *
     * @param aiConfig - The AI configuration containing the prompts.
     * @returns The most recent valid `Prompt` object, or `null` if none is found.
     */
    private _prepareAndValidatePrompts(aiConfig: AiConfig | null, promptType: "raw" | "smart"): Prompt | null {
        if (!aiConfig || !aiConfig.prompts || aiConfig.prompts.length === 0) {
            this.logger.error("AI config or prompts are missing.")
            return null
        }

        const filteredPrompts = aiConfig.prompts.filter((p) => p.type === promptType && p.prompt)

        if (filteredPrompts.length === 0) {
            this.logger.error(`No active, valid prompts found for type: ${promptType}.`)
            return null
        }

        // Return the most recent valid prompt
        return filteredPrompts.sort((a, b) => b.id! - a.id!)[0]
    }

    // Prepares the final prompt for a smart score summary.
    private _prepareSmartScorePrompt(
        template: string,
        data: {
            username: string
            displayName: string
            rawScores: string
            smartScore: number
        },
    ): string {
        return template
            .replace(/{{\s*username\s*}}/g, data.username)
            .replace(/{{\s*displayName\s*}}/g, data.displayName)
            .replace(/{{\s*rawScores\s*}}/g, data.rawScores)
            .replace(/{{\s*smartScore\s*}}/g, data.smartScore.toString())
    }

    // Prepares the final prompt for a raw score.
    private _preparePrompt(
        template: string,
        data: {
            content: string
            username: string
            displayName: string
            maxValue: number
            logs: string
        },
    ): string {
        let populatedTemplate = template

        // A simple and safe replacement loop for our placeholders.
        // This avoids the use of `new Function()` which can be brittle.
        Object.entries(data).forEach(([key, value]) => {
            // The regex looks for placeholders like ${key} and replaces them with the provided value.
            const placeholder = new RegExp(`\\$\\{${key}\\}`, "g")
            populatedTemplate = populatedTemplate.replace(placeholder, String(value))
        })

        this.logger.info(`[DIAGNOSTIC] AI input - base prompt prepared successfully.`)
        return populatedTemplate
    }

    /**
     * Gets the user's identity, falling back to sensible defaults.
     *
     * @returns An object containing the `username` and `displayName`.
     */
    private _getUserIdentity(
        forumUser: ForumUser,
        userData: { username?: string; displayName?: string } | undefined,
    ): { username: string; displayName: string } {
        const username = forumUser.forum_username || userData?.username || `user_${forumUser.user_id}`
        const displayName = userData?.displayName || username
        return { username, displayName }
    }

    // Truncates content to a specified number of characters.
    private _truncateContent(content: string, maxChars: number | null | undefined): string {
        if (!maxChars) {
            this.logger.warn("No maxChars provided for content truncation. Using default of 8000.")
            maxChars = 8000
        }

        if (content.length <= maxChars) {
            this.logger.info(`[DIAGNOSTIC] Content truncation - using full content: ${content.length} characters`)
            return content
        }

        // Truncate and add "..." if needed
        const truncated = content.substring(0, maxChars - 3) + "..."
        this.logger.info(`[DIAGNOSTIC] Content truncation - truncated to ${truncated.length} characters`)
        return truncated
    }

    /**
     * Executes the call to the AI service and handles response validation.
     *
     * @returns An `AIScoreOutput` object or `null` on failure.
     */
    private async _executeAIServiceCall(
        prompt: string,
        aiConfig: AiConfig,
        userId: number,
    ): Promise<AIScoreOutput | null> {
        const modelConfig: ModelConfig = {
            model: aiConfig.model,
            temperature: aiConfig.temperature,
            maxTokens: 4096, // A reasonable default
        }

        this.logger.info(`[DIAGNOSTIC] AI input - model: ${aiConfig.model}, temperature: ${aiConfig.temperature}`)

        const aiServiceClient = getAIServiceClient(this.appConfig, aiConfig, this.logger)

        try {
            this.logger.info(`Making OpenAI API call...`)
            const aiScore = await aiServiceClient.getStructuredResponse(prompt, modelConfig)

            this.logger.info(
                `[DIAGNOSTIC] AI output - completion tokens: ${aiScore.completionTokens || 0}, total tokens: ${(aiScore.promptTokens || 0) + (aiScore.completionTokens || 0)}`,
            )

            // For raw scores, a numeric value is required. For smart scores, it's optional.
            if (typeof aiScore.value !== "number") {
                this.logger.warn(
                    `AI response for user ${userId} is missing a numeric 'value'. This is acceptable for smart score summaries.`,
                )
            }

            // Cap the score at the configured maximum value if it exists
            if (typeof aiScore.value === "number" && aiScore.value > aiConfig.maxValue) {
                this.logger.warn(
                    `AI score for user ${userId} (${aiScore.value}) > maxValue (${aiConfig.maxValue}). Capping.`,
                )
                aiScore.value = aiConfig.maxValue
            }

            // Clean response if it has markdown backticks
            if (aiScore.rawResponse) {
                const cleanResponse = aiScore.rawResponse.replace(/^```json\n?|\n?```$/g, "").trim()
                this.logger.info(`[DIAGNOSTIC] AI output - cleaned response from markdown if present`)
            }

            return aiScore
        } catch (error: any) {
            this.logger.error(`Error analyzing user data: ${error.message}`)
            return null
        }
    }

    // Transforms a validated AIScoreOutput into a UserSignalStrength object.
    private _transformScoreOutput(
        aiOutput: AIScoreOutput,
        userId: number,
        projectId: string,
        aiConfig: AiConfig,
        promptId: number,
        scoreType: "raw" | "smart",
        options: {
            day?: string
            logs?: string
            numericScore?: number
        },
    ): UserSignalStrength {
        let value: number | null = null
        let raw_value: number | null = null
        let day: string
        let logs: string | null = null

        if (scoreType === "raw") {
            raw_value = aiOutput.value // The direct score from the AI.
            day = options.day! // Raw scores are for a specific day.
            const analysisLogs = `${options.logs ? options.logs + "\n" : ""}userDataString.length: ${
                options.logs?.length ?? 0
            }\ntruncatedContent.length: ${(aiOutput.promptTokens || 0) * 4}`
            logs = analysisLogs
            this.logger.info(`[DIAGNOSTIC] Raw score output - creating UserSignalStrength with raw_value: ${raw_value}`)
        } else {
            // smart score
            value = options.numericScore! // The deterministic score.
            day = new Date().toISOString().split("T")[0] // Smart scores are for 'today'.
            this.logger.info(`[DIAGNOSTIC] Smart score output - creating UserSignalStrength with value: ${value}`)
        }

        return {
            user_id: userId,
            signal_strength_id: aiConfig.signalStrengthId,
            project_id: projectId,
            value,
            raw_value,
            summary: aiOutput.summary,
            description: aiOutput.description,
            improvements: aiOutput.improvements,
            explained_reasoning: JSON.stringify(aiOutput.explained_reasoning),
            created: Math.floor(Date.now() / 1000),
            day,
            model: aiConfig.model,
            temperature: aiConfig.temperature,
            max_chars: aiConfig.maxChars,
            logs,
            request_id: aiOutput.requestId,
            prompt_tokens: aiOutput.promptTokens,
            completion_tokens: aiOutput.completionTokens,
            test_requesting_user: null,
            prompt_id: promptId,
            max_value: aiConfig.maxValue,
        }
    }
}
