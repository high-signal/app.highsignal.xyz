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
     * This replicates the first part of the legacy `analyzeForumUserActivityOLD.js` script.
     */
    public async generateRawScores(
        user: ForumUser,
        day: string,
        content: string,
        logs: string, // This is now passed in from the adapter
        signalConfig: AiConfig,
        projectId: string,
    ): Promise<UserSignalStrength | null> {
        const promptConfig = this._prepareAndValidatePrompts(signalConfig, "raw")
        if (!promptConfig) {
            this.logger.error("Could not get valid prompt for raw score. Aborting.", { signalStrengthId: signalConfig.signalStrengthId, projectId })
            return null
        }


        const { username, displayName } = this._getUserIdentity(user, undefined)
        // Replicate legacy logic: parse actions, strip HTML, then extract ONLY the text content for the AI.
        const dailyActions = JSON.parse(content) as { cooked?: string }[]
        const contentString = dailyActions
            .map(action => action.cooked)
            .filter((cooked): cooked is string => !!cooked) // Ensure we only have strings
            .map(cooked => cooked.replace(/<\/?[^>]+(>|$)/g, '')) // Strip HTML
            .join('\n\n---\n\n');

        const truncatedContent = this._truncateContent(contentString, signalConfig.maxChars)

        if (truncatedContent.length === 0) {
            this.logger.warn(`No content for user ${user.user_id} on day ${day}, skipping.`)
            return null
        }

        this.logger.info(`[DIAGNOSTIC] Using raw prompt template: ${promptConfig.prompt!}`);
        const finalPrompt = this._preparePrompt(promptConfig.prompt!, {
            content: truncatedContent,
            username,
            displayName,
            maxValue: signalConfig.maxValue,
            logs: logs,
        });

        const aiScore = await this._executeAIServiceCall(finalPrompt, signalConfig, user.user_id);

        if (aiScore) {
            this.logger.info(`Successfully generated raw score for user ${user.user_id} on day ${day}.`);
            return this._transformRawScoreOutput(
                aiScore,
                user.user_id,
                day,
                projectId,
                signalConfig,
                promptConfig.id,
                logs, // Pass the logs from the adapter
            );
        }

        return null
    }

    /**
     * PHASE 2: Generates a single 'smart' score based on all of a user's raw scores.
     * This replicates the second part of the legacy `analyzeForumUserActivityOLD.js` script.
     */
    public async generateSmartScoreSummary(
        user: ForumUser,
        rawScores: RawScore[],
        signalConfig: AiConfig,
        projectId: string,
    ): Promise<UserSignalStrength | null> {
        // 1. Calculate the smart score deterministically, exactly like the legacy script.
        const { smartScore, topBandDays } = calculateSmartScore(rawScores, 30) // 30 days is legacy default
        this.logger.info(`Calculated deterministic smart score of ${smartScore} for user ${user.user_id}.`)

        // 2. Prepare for the AI call to get a QUALITATIVE summary.
        const promptConfig = this._prepareAndValidatePrompts(signalConfig, "smart")
        if (!promptConfig) {
            this.logger.error("Could not get valid prompt for smart score. Aborting.", { signalStrengthId: signalConfig.signalStrengthId, projectId })
            return null
        }

        // Use only the raw scores from the top band as context for the AI, as per legacy logic.
        const topBandScores = rawScores.filter(rs => topBandDays.includes(rs.day));
        const rawScoresForPrompt = JSON.stringify(topBandScores, null, 2);

        const { username, displayName } = this._getUserIdentity(user, undefined)
        this.logger.info(`[DIAGNOSTIC] Using smart score prompt template: ${promptConfig.prompt!}`);
        const finalPrompt = this._prepareSmartScorePrompt(promptConfig.prompt!, {
            username,
            displayName,
            rawScores: rawScoresForPrompt,
            smartScore: smartScore, // Provide the calculated score to the AI for context.
        })

        // 3. Execute the AI call for the qualitative summary.
        // Note: We expect the AI to provide text, not a score. The 'value' field in the response will be ignored.
        const aiSummary = await this._executeAIServiceCall(finalPrompt, signalConfig, user.user_id)
        if (!aiSummary) {
            this.logger.error(`AI call for smart score summary failed for user ${user.user_id}.`)
            return null
        }

        // 4. Transform and combine the deterministic score and the AI summary.
        return this._transformSmartScoreOutput(aiSummary, smartScore, user.user_id, projectId, signalConfig, promptConfig.id!)
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

        const filteredPrompts = aiConfig.prompts.filter(
            (p) => p.type === promptType && p.prompt,
        )

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
        return template
            .replace(/{{\s*content\s*}}/g, data.content)
            .replace(/{{\s*username\s*}}/g, data.username)
            .replace(/{{\s*displayName\s*}}/g, data.displayName)
            .replace(/{{\s*maxValue\s*}}/g, data.maxValue.toString())
            .replace(/{{\s*logs\s*}}/g, data.logs)
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
     * Truncates content to a specified number of characters, matching legacy behavior.
     * The legacy system adds "..." if the content is truncated.
     */
    private _truncateContent(content: string, maxChars: number | null | undefined): string {
        if (!maxChars) {
            return content
        }
        if (content.length <= maxChars) {
            return content
        }
        // Legacy behavior: truncate and add ellipsis if needed.
        return content.substring(0, maxChars - 3) + "..."
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

        const aiServiceClient = getAIServiceClient(this.appConfig, aiConfig, this.logger)

        try {
            const aiScore = await aiServiceClient.getStructuredResponse(prompt, modelConfig)

            // For raw scores, a numeric value is required. For smart scores, it's optional.
            if (typeof aiScore.value !== "number") {
                this.logger.warn(`AI response for user ${userId} is missing a numeric 'value'. This is acceptable for smart score summaries.`)
            }

            // Cap the score at the configured maximum value if it exists
            if (typeof aiScore.value === "number" && aiScore.value > aiConfig.maxValue) {
                this.logger.warn(
                    `AI score for user ${userId} (${aiScore.value}) > maxValue (${aiConfig.maxValue}). Capping.`,
                )
                aiScore.value = aiConfig.maxValue
            }
            return aiScore
        } catch (error: any) {
            this.logger.error(`AI service call failed for user ${userId}.`, {
                error: error.message,
            })
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
            created: Math.floor(new Date().getTime() / 1000),
            day: day,
            model: aiConfig.model,
            temperature: aiConfig.temperature,
            max_chars: aiConfig.maxChars,
            logs: logs,
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
