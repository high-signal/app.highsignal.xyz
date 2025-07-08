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
     * Generates AI scores for a batch of platform outputs.
     *
     * @param platformOutputs - An array of standardized data from a platform adapter.
     * @param day - The target day for the scores in 'YYYY-MM-DD' format.
     * @param projectId - The ID of the project being processed.
     * @param signalStrengthId - The ID of the signal strength configuration to use.
     * @param aiConfigOverride - Optional. An AI configuration to use instead of fetching from the DB.
     * @returns A promise that resolves to an array of `UserSignalStrength` objects.
     */
    public async getAiScores(
        platformOutputs: PlatformOutput[],
        day: string, // YYYY-MM-DD
        projectId: string,
        signalStrengthId: string,
        aiConfigOverride?: AiConfig,
    ): Promise<UserSignalStrength[]> {
        this.logger.info(`AIOrchestrator: Starting AI processing for ${platformOutputs.length} items.`, {
            signalStrengthId,
            day,
            projectId,
        })

        const aiConfig =
            aiConfigOverride ?? (await getLegacySignalConfig(this.supabase, signalStrengthId, projectId))
        const promptConfig = this._prepareAndValidatePrompts(aiConfig, "raw")

        if (!aiConfig || !promptConfig) {
            this.logger.error("AIOrchestrator: Could not obtain valid AI config or prompt. Aborting.", {
                signalStrengthId,
                projectId,
            })
            return []
        }

        const groupedByAuthor = this._groupPlatformOutputsByAuthor(platformOutputs)
        const authorIds = Object.keys(groupedByAuthor)
            .map((id) => parseInt(id, 10))
            .filter((id) => !isNaN(id))

        const usersDataMap = await getUsersByIds(this.supabase, authorIds)
        const userSignalStrengths: UserSignalStrength[] = []

        for (const [authorId, outputs] of Object.entries(groupedByAuthor)) {
            const userId = parseInt(authorId, 10)
            if (isNaN(userId)) {
                this.logger.warn(`Could not parse author ID '${authorId}'. Skipping.`)
                continue
            }

            const score = await this._generateScoreForUser(
                userId,
                outputs,
                usersDataMap.get(userId),
                aiConfig,
                promptConfig,
            )

            if (score) {
                const userSignalStrength = this._transformAIScoreToUserSignalStrength(
                    score,
                    userId,
                    day,
                    projectId,
                    signalStrengthId,
                    aiConfig,
                    promptConfig.id!,
                )
                userSignalStrengths.push(userSignalStrength)
            }
        }

        this.logger.info(`AIOrchestrator: Finished. Generated ${userSignalStrengths.length} records.`)
        return userSignalStrengths
    }

    /**
     * Generates a single 'raw' score based on a user's daily activity.
     *
     * @param activitySummary - A string summarizing the user's activity.
     * @param user - The user to score.
     * @param projectId - The project ID.
     * @param signalStrengthId - The signal strength ID.
     * @param aiConfigOverride - Optional. An AI configuration to use instead of fetching from the DB.
     * @returns A promise that resolves to an object containing the score and prompt ID, or null.
     */
    public async generateRawScoreForUserActivity(
        activitySummary: string,
        user: ForumUser,
        projectId: string,
        signalStrengthId: string,
        aiConfigOverride?: AiConfig,
    ): Promise<RawScoreGenerationResult | null> {
        const aiConfig =
            aiConfigOverride ?? (await getLegacySignalConfig(this.supabase, signalStrengthId, projectId))
        const promptConfig = this._prepareAndValidatePrompts(aiConfig, "raw")

        if (!aiConfig || !promptConfig) {
            this.logger.error(
                `AIOrchestrator: Could not get valid AI config or prompt for raw score generation.`,
                {
                    signalStrengthId,
                    projectId,
                    userId: user.user_id,
                },
            )
            return null
        }

        const truncatedContent = this._truncateContent(activitySummary, aiConfig.maxChars)
        const finalPrompt = this._preparePrompt(promptConfig.prompt!, {
            content: truncatedContent,
            username: user.forum_username ?? "",
            displayName: user.forum_username ?? "",
            maxValue: aiConfig.maxValue,
        })

        const score = await this._executeAIServiceCall(finalPrompt, aiConfig, user.user_id)

        if (score) {
            return {
                score,
                promptId: promptConfig.id,
                model: aiConfig.model,
                temperature: aiConfig.temperature,
                promptTokens: score.promptTokens ?? 0,
                completionTokens: score.completionTokens ?? 0,
                requestId: score.requestId ?? "",
            }
        }

        return null
    }

    public async generateSmartScoreSummary(
        user: ForumUser,
        rawScores: RawScore[],
        smartScore: number,
        projectId: string,
        signalStrengthId: string,
    ): Promise<SmartScoreOutput | null> {
        this.logger.info(`Generating smart score summary for user ${user.user_id}...`)

        const aiConfig = await getLegacySignalConfig(this.supabase, signalStrengthId, projectId)
        const promptConfig = this._prepareAndValidatePrompts(aiConfig, "smart")

        if (!aiConfig || !promptConfig || !promptConfig.prompt) {
            this.logger.error(
                `Could not obtain valid AI config or prompt for smart score summary.`,
                {
                    signalStrengthId,
                    projectId,
                },
            )
            return null
        }

        const rawScoresString = rawScores
            .map((s) => `On ${s.day}, score was ${s.raw_value}/${s.max_value}.`)
            .join("\n")

        const { username, displayName } = this._getUserIdentity(user, undefined)

        const finalPrompt = this._prepareSmartScorePrompt(promptConfig.prompt, {
            username,
            displayName,
            rawScores: rawScoresString,
            smartScore,
        })

        const aiServiceClient = getAIServiceClient(this.appConfig, aiConfig, this.logger)
        const modelConfig: ModelConfig = {
            model: aiConfig.model,
            temperature: aiConfig.temperature,
            maxTokens: 1024,
        }

        try {
            const aiScore = await aiServiceClient.getStructuredResponse(finalPrompt, modelConfig)

            if (!aiScore || !aiScore.summary) {
                this.logger.error(
                    `Smart score summary response for user ${user.user_id} is missing a summary.`,
                )
                return null
            }

            return {
                smartScore,
                topBandDays: [], // Placeholder for now, will be populated in the adapter
                summary: aiScore.summary,
                description: aiScore.description,
                improvements: aiScore.improvements,
                explained_reasoning:
                    typeof aiScore.explained_reasoning === "string"
                        ? aiScore.explained_reasoning
                        : aiScore.explained_reasoning?.reason ?? "",
            }
        } catch (error: any) {
            this.logger.error(`AI service call for smart score summary failed for user ${user.user_id}.`, {
                error: error.message,
            })
            return null
        }
    }

    /**
     * Fetches, validates, and selects the most recent, valid prompt of a given type.
     *
     * @param aiConfig - The AI configuration containing the prompts.
     * @returns The most recent valid `Prompt` object, or `null` if none is found.
     */
    private _prepareAndValidatePrompts(aiConfig: AiConfig | null, promptType: "raw" | "smart"): Prompt | null {
        if (!aiConfig?.prompts || aiConfig.prompts.length === 0) {
            this.logger.error("No prompts found in the provided AI configuration.")
            return null
        }

        const relevantPrompts = aiConfig.prompts
            .filter((p) => p.type === promptType)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        if (relevantPrompts.length === 0) {
            this.logger.warn(`No prompts of type '${promptType}' found in the configuration.`)
            return null
        }

        const latestPrompt = relevantPrompts[0]

        if (!latestPrompt.prompt) {
            this.logger.error(`The latest prompt of type '${promptType}' (ID: ${latestPrompt.id}) is empty.`)
            return null
        }

        return latestPrompt
    }

    /**
     * Groups platform outputs by their author's ID.
     */
    private _groupPlatformOutputsByAuthor(platformOutputs: PlatformOutput[]): Record<string, PlatformOutput[]> {
        return platformOutputs.reduce(
            (acc, output) => {
                const authorId = output.author
                if (!acc[authorId]) {
                    acc[authorId] = []
                }
                acc[authorId].push(output)
                return acc
            },
            {} as Record<string, PlatformOutput[]>,
        )
    }

    /**
     * Truncates content to a specified maximum number of characters.
     */
    private _truncateContent(content: string, maxChars: number): string {
        if (content.length <= maxChars) {
            return content
        }
        this.logger.warn(`Truncating content from ${content.length} to ${maxChars} characters.`)
        return content.substring(0, maxChars)
    }

    /**
     * Injects dynamic data into a prompt template.
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
            .replace(/{{\s*raw_scores\s*}}/g, data.rawScores)
            .replace(/{{\s*smart_score\s*}}/g, String(data.smartScore))
    }

    private _preparePrompt(
        template: string,
        data: {
            content: string
            username: string
            displayName: string
            maxValue: number
        },
    ): string {
        return template
            .replace(/{{\s*content\s*}}/g, data.content)
            .replace(/{{\s*username\s*}}/g, data.username)
            .replace(/{{\s*displayName\s*}}/g, data.displayName)
            .replace(/{{\s*maxValue\s*}}/g, String(data.maxValue))
    }

    /**
     * Resolves a user's canonical username and display name.
     *
     * @param forumUser - The user's platform-specific identity.
     * @param userData - The user's core profile data from the 'users' table.
     * @returns An object containing the `username` and `displayName`.
     */
    private _getUserIdentity(
        forumUser: ForumUser,
        userData: { username?: string; displayName?: string } | undefined,
    ): { username: string; displayName: string } {
        return {
            username: userData?.username ?? forumUser.forum_username ?? String(forumUser.user_id),
            displayName: userData?.displayName ?? forumUser.forum_username ?? "Unknown User",
        }
    }

    /**
     * Generates a score for a single user's aggregated activity.
     *
     * @param userId - The ID of the user to score.
     * @param outputs - The user's aggregated activity.
     * @param userData - The user's core profile data from the 'users' table.
     * @param aiConfig - The AI configuration to use.
     * @param promptConfig - The prompt configuration to use.
     * @returns An `AIScoreOutput` object or `null` if an error occurs.
     */
    private async _generateScoreForUser(
        userId: number,
        outputs: PlatformOutput[],
        userData: { username?: string; displayName?: string } | undefined,
        aiConfig: AiConfig,
        promptConfig: Prompt,
    ): Promise<AIScoreOutput | null> {
        const combinedText = outputs.map((o) => o.content).join("\n\n")
        const truncatedContent = this._truncateContent(combinedText, aiConfig.maxChars)

        if (truncatedContent.length === 0) {
            this.logger.warn(`No content for user ${userId}, skipping.`)
            return null
        }

        const { username, displayName } = this._getUserIdentity({ user_id: userId } as ForumUser, userData)

        const finalPrompt = this._preparePrompt(promptConfig.prompt!, {
            content: truncatedContent,
            username,
            displayName,
            maxValue: aiConfig.maxValue,
        })

        return this._executeAIServiceCall(finalPrompt, aiConfig, userId)
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

            if (typeof aiScore.value !== "number") {
                this.logger.error(`AI response for user ${userId} is missing a numeric 'value'.`)
                return null
            }

            // Cap the score at the configured maximum value
            if (aiScore.value > aiConfig.maxValue) {
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
     * Transforms a validated `AIScoreOutput` into a `UserSignalStrength` object.
     */
    private _transformAIScoreToUserSignalStrength(
        aiScore: AIScoreOutput,
        userId: number,
        day: string,
        projectId: string,
        signalStrengthId: string,
        aiConfig: AiConfig,
        promptId: number,
    ): UserSignalStrength {
        return {
            user_id: userId,
            signal_strength_id: signalStrengthId,
            project_id: projectId,
            value: aiScore.value!,
            summary: aiScore.summary,
            description: aiScore.description,
            improvements: aiScore.improvements,
            explained_reasoning:
                typeof aiScore.explained_reasoning === "object" && aiScore.explained_reasoning !== null
                    ? aiScore.explained_reasoning.reason
                    : aiScore.explained_reasoning,
            created: Math.floor(new Date().getTime() / 1000),
            day: day,
            model: aiConfig.model,
            temperature: aiConfig.temperature,
            max_chars: aiConfig.maxChars,
            request_id: aiScore.requestId,
            prompt_tokens: aiScore.promptTokens,
            completion_tokens: aiScore.completionTokens,
            test_requesting_user: null,
            prompt_id: promptId,
            max_value: aiConfig.maxValue,
        }
    }
}
