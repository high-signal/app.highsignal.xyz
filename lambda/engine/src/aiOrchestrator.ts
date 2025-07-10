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

    constructor(appConfig: AppConfig, logger: Logger, supabase: SupabaseClient) {
        this.appConfig = appConfig
        this.logger = logger
        this.supabase = supabase
    }

    /**
     * PHASE 1: Generates 'raw' scores for each day of user activity.
     */
    public async generateRawScores(
        user: ForumUser,
        day: string,
        content: string,
        logs: string,
        signalConfig: AiConfig,
        projectId: string,
    ): Promise<UserSignalStrength | null> {
        const promptConfig = this._prepareAndValidatePrompts(signalConfig, "raw")
        if (!promptConfig) {
            this.logger.error("Could not get valid prompt for raw score. Aborting.", {
                signalStrengthId: signalConfig.signalStrengthId,
                projectId,
            })
            return null
        }

        const { username, displayName } = this._getUserIdentity(user, undefined)

        this.logger.info(
            `[DIAGNOSTIC] Raw content before processing for user ${user.user_id} on day ${day}: ${content.substring(0, 200)}...`,
        )

        const dailyActions = JSON.parse(content)

        // Process object for HTML
        this.logger.info(`[DIAGNOSTIC] Processing ${dailyActions.length} actions through HTML stripper`)
        const processedActions = processObjectForHtml(dailyActions)

        // Convert processed actions to a string representation
        const userDataString = JSON.stringify(processedActions, null, 2)
        this.logger.info(`[DIAGNOSTIC] Content length before truncation: ${userDataString.length} characters`)

        // Truncate content
        const truncatedContent = this._truncateContent(userDataString, signalConfig.maxChars)
        this.logger.info(`[DIAGNOSTIC] Truncated content length: ${truncatedContent.length} characters`)
        this.logger.info(`[DIAGNOSTIC] Was content truncated: ${userDataString.length !== truncatedContent.length}`)
        this.logger.info(`[DIAGNOSTIC] Truncation - max chars allowed: ${signalConfig.maxChars}`)

        if (truncatedContent.length === 0) {
            this.logger.warn(`No content for user ${user.user_id} on day ${day}, skipping.`)
            return null
        }

        this.logger.info(`[DIAGNOSTIC] Using raw prompt template: ${promptConfig.prompt!}`)
        // Construct prompt
        const prompt = this._preparePrompt(promptConfig.prompt || "", {
            content: truncatedContent,
            username,
            displayName,
            maxValue: signalConfig.maxValue,
            logs,
        })

        this.logger.info(`[DIAGNOSTIC] AI input - base prompt prepared with template from DB`)

        // Create messages array
        const messages = [
            {
                role: "system",
                content:
                    "You are a helpful assistant that evaluates user activity data. You must respond with only valid JSON.",
            },
            {
                role: "user",
                content: prompt,
            },
        ]

        this.logger.info(`[DIAGNOSTIC] AI input - system and user messages prepared`)

        const aiScore = await this._executeAIServiceCall(prompt, signalConfig, user.user_id)
        if (!aiScore) {
            this.logger.error("AI service call failed for raw score generation.", { userId: user.user_id, day })
            return null
        }

        this.logger.info(`Analysis complete for user: ${username}`)

        return this._transformRawScoreOutput(aiScore, user.user_id, day, projectId, signalConfig, promptConfig.id, logs)
    }

    /**
     * PHASE 2: Generates a single 'smart' score based on all of a user's raw scores.
     */
    public async generateSmartScoreSummary(
        user: ForumUser,
        rawScores: RawScore[],
        signalConfig: AiConfig,
        projectId: string,
    ): Promise<UserSignalStrength | null> {
        // Use the deterministic calculation.
        const { smartScore, topBandDays } = calculateSmartScore(rawScores, signalConfig.previous_days ?? 30)

        this.logger.info(
            `[DIAGNOSTIC] Smart score calculated for user ${user.user_id}. Score: ${smartScore}, Top Band Days: ${topBandDays.length}`,
        )

        // Construct the output directly without an AI call.
        return {
            user_id: user.user_id,
            signal_strength_id: signalConfig.signalStrengthId,
            project_id: projectId,
            value: smartScore, // The deterministic score.
            raw_value: null, // Smart scores do not have a raw_value.
            summary: `Top band days: ${JSON.stringify(topBandDays)}`, // Store top band days for diagnostics
            description: "Smart score calculated based on raw score performance.",
            improvements: null,
            explained_reasoning: null,
            created: Math.floor(new Date().getTime() / 1000),
            day: (() => {
                const d = new Date()
                d.setDate(d.getDate() - 1)
                return d.toISOString().split("T")[0]
            })(),
            model: null,
            temperature: null,
            max_chars: null,
            logs: `Calculated smart score from ${rawScores.length} raw scores. Found ${topBandDays.length} days in top band.`,
            request_id: null,
            prompt_tokens: 0,
            completion_tokens: 0,
            test_requesting_user: null,
            prompt_id: null, // No prompt used
            max_value: signalConfig.maxValue,
        }
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

    /**
     * Prepares the final prompt for a smart score summary.
     */
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

    /**
     * Prepares the final prompt for a raw score.
     */
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

    /**
     * Truncates content to a specified number of characters.
     */
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

    /**
     * Transforms a validated `AIScoreOutput` into a `UserSignalStrength` object for raw scores.
     */
    private _transformRawScoreOutput(
        aiScore: AIScoreOutput,
        userId: number,
        day: string,
        projectId: string,
        aiConfig: AiConfig,
        promptId: number,
        logs: string,
    ): UserSignalStrength {
        const analysisLogs = `${logs ? logs + "\n" : ""}userDataString.length: ${logs.length}\ntruncatedContent.length: ${(aiScore.promptTokens || 0) * 4}`

        this.logger.info(`[DIAGNOSTIC] Raw score output - creating UserSignalStrength with raw_value: ${aiScore.value}`)

        return {
            user_id: userId,
            signal_strength_id: aiConfig.signalStrengthId,
            project_id: projectId,
            value: null, // Raw scores use raw_value, not value.
            raw_value: aiScore.value, // The direct score from the AI.
            summary: aiScore.summary,
            description: aiScore.description,
            improvements: aiScore.improvements,
            explained_reasoning: JSON.stringify(aiScore.explained_reasoning),
            created: Math.floor(Date.now() / 1000),
            day: day,
            model: aiConfig.model,
            temperature: aiConfig.temperature,
            max_chars: aiConfig.maxChars,
            logs: analysisLogs,
            request_id: aiScore.requestId,
            prompt_tokens: aiScore.promptTokens,
            completion_tokens: aiScore.completionTokens,
            test_requesting_user: null,
            prompt_id: promptId,
            max_value: aiConfig.maxValue,
        }
    }

    /**
     * Transforms a validated `AIScoreOutput` into a `UserSignalStrength` object for smart scores.
     */
    private _transformSmartScoreOutput(
        aiSummary: AIScoreOutput,
        smartScore: number,
        userId: number,
        projectId: string,
        aiConfig: AiConfig,
        promptId: number,
    ): UserSignalStrength {
        return {
            user_id: userId,
            signal_strength_id: aiConfig.signalStrengthId,
            project_id: projectId,
            value: smartScore, // The deterministic score.
            raw_value: null, // Smart scores do not have a raw_value.
            summary: aiSummary.summary,
            description: aiSummary.description,
            improvements: aiSummary.improvements,
            explained_reasoning: JSON.stringify(aiSummary.explained_reasoning),
            created: Math.floor(new Date().getTime() / 1000),
            day: new Date().toISOString().split("T")[0], // Smart scores are for 'today'.
            model: aiConfig.model,
            temperature: aiConfig.temperature,
            max_chars: aiConfig.maxChars,
            logs: null,
            request_id: aiSummary.requestId,
            prompt_tokens: aiSummary.promptTokens,
            completion_tokens: aiSummary.completionTokens,
            test_requesting_user: null,
            prompt_id: promptId,
            max_value: aiConfig.maxValue,
        }
    }
}
