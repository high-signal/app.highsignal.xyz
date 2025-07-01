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

import { AppConfig } from "./config"
import { getAiConfig, getUsersByIds } from "./dbClient"
import { Logger } from "./logger"
import { getAIServiceClient } from "./aiService"
import type {
    AiConfig,
    AIScoreOutput,
    ForumUser,
    ModelConfig,
    PlatformOutput,
    Prompt,
    UserSignalStrength,
} from "./types"

/**
 * Orchestrates the AI scoring process by coordinating database fetches,
 * prompt engineering, and AI service calls.
 */
export class AIOrchestrator {
    private logger: Logger
    private appConfig: AppConfig

    constructor(appConfig: AppConfig, logger: Logger) {
        this.appConfig = appConfig
        this.logger = logger
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
        projectId: number,
        signalStrengthId: number,
        aiConfigOverride?: AiConfig,
    ): Promise<UserSignalStrength[]> {
        this.logger.info(`AIOrchestrator: Starting AI processing for ${platformOutputs.length} items.`, {
            signalStrengthId,
            day,
            projectId,
        })

        const aiConfig = aiConfigOverride ?? (await getAiConfig(signalStrengthId, projectId))
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

        const usersDataMap = await getUsersByIds(authorIds)
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
                const userSignal = this._transformAIScoreToUserSignalStrength(
                    score,
                    userId,
                    day,
                    projectId,
                    signalStrengthId,
                    aiConfig,
                    promptConfig.id,
                )
                userSignalStrengths.push(userSignal)
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
     * @param aiConfigOverride - Optional AI config override.
     * @returns A promise resolving to an `AIScoreOutput` or null.
     */
    public async generateRawScoreForUserActivity(
        activitySummary: string,
        user: ForumUser,
        projectId: number,
        signalStrengthId: number,
        aiConfigOverride?: AiConfig,
    ): Promise<{ score: AIScoreOutput; promptId: number } | null> {
        this.logger.info(`Starting raw score generation for user ${user.user_id}.`, { signalStrengthId, projectId })

        const aiConfig = aiConfigOverride ?? (await getAiConfig(signalStrengthId, projectId))
        const promptConfig = this._prepareAndValidatePrompts(aiConfig, "raw")

        if (!aiConfig || !promptConfig) {
            this.logger.error("Valid AI config or prompt not found for raw scoring.")
            return null
        }

        const usersDataMap = await getUsersByIds([user.user_id])
        const { username, displayName } = this._getUserIdentity(user, usersDataMap.get(user.user_id))

        const finalPrompt = this._preparePrompt(promptConfig.prompt!, {
            content: activitySummary,
            username,
            displayName,
            maxValue: aiConfig.maxValue,
        })

        const aiScore = await this._executeAIServiceCall(finalPrompt, aiConfig, user.user_id)
        return aiScore ? { score: aiScore, promptId: promptConfig.id } : null
    }

    /**
     * Generates a 'smart' score by analyzing a series of raw scores.
     *
     * @param rawScores - An array of previous raw scores.
     * @param user - The user to score.
     * @param projectId - The project ID.
     * @param signalStrengthId - The signal strength ID.
     * @param aiConfigOverride - Optional AI config override.
     * @returns A promise resolving to an `AIScoreOutput` or null.
     */
    public async generateSmartScoreFromRawScores(
        rawScores: Pick<UserSignalStrength, "day" | "value" | "summary">[],
        user: ForumUser,
        projectId: number,
        signalStrengthId: number,
        aiConfigOverride?: AiConfig,
    ): Promise<{ score: AIScoreOutput; promptId: number } | null> {
        this.logger.info(`Generating smart score for user ${user.user_id}.`, {
            projectId,
        })

        const aiConfig = aiConfigOverride ?? (await getAiConfig(signalStrengthId, projectId))
        const promptConfig = this._prepareAndValidatePrompts(aiConfig, "smart")

        if (!aiConfig || !promptConfig) {
            this.logger.error("Could not get valid AI config or smart prompt. Aborting.")
            return null
        }

        if (!rawScores || rawScores.length === 0) {
            this.logger.warn("No raw scores provided; cannot generate smart score.")
            return null
        }

        const usersDataMap = await getUsersByIds([user.user_id])
        const { username, displayName } = this._getUserIdentity(user, usersDataMap.get(user.user_id))

        const formattedContent =
            `The following are raw scores for ${username}:\n` +
            rawScores
                .map((s) => `- On ${s.day}, score was ${s.value}/${aiConfig.maxValue}. Summary: ${s.summary}`)
                .join("\n")

        const finalPrompt = this._preparePrompt(promptConfig.prompt!, {
            content: formattedContent,
            username,
            displayName,
            maxValue: aiConfig.maxValue,
        })

        const smartScore = await this._executeAIServiceCall(finalPrompt, aiConfig, user.user_id)

    if (smartScore) {
        return { score: smartScore, promptId: promptConfig.id }
    }

    return null
    }

    // ==========================================================================
    // PRIVATE HELPER METHODS
    // ==========================================================================

    /**
     * Fetches, validates, and selects the most recent, valid prompt of a given type.
     *
     * @param aiConfig - The AI configuration containing the prompts.
     * @param type - The type of prompt to find ('raw' or 'smart').
     * @returns The most recent valid `Prompt` object, or `null` if none is found.
     */
    private _prepareAndValidatePrompts(aiConfig: AiConfig | null, type: "raw" | "smart"): Prompt | null {
        if (!aiConfig || !aiConfig.prompts || aiConfig.prompts.length === 0) {
            this.logger.error("AI configuration or prompts are missing.")
            return null
        }

        const validPrompts = aiConfig.prompts
            .filter((p) => p.type === type && p.prompt)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        if (validPrompts.length === 0) {
            this.logger.error(`No valid prompts of type '${type}' found in the configuration.`)
            return null
        }

        return validPrompts[0]
    }

    /**
     * Groups platform outputs by their author's ID.
     */
    private _groupPlatformOutputsByAuthor(platformOutputs: PlatformOutput[]): Record<string, PlatformOutput[]> {
        return platformOutputs.reduce((acc: Record<string, PlatformOutput[]>, output) => {
            const author = String(output.author)
            if (!acc[author]) {
                acc[author] = []
            }
            acc[author].push(output)
            return acc
        }, {})
    }

    /**
     * Truncates content to a specified maximum number of characters.
     */
    private _truncateContent(content: string, maxChars: number): string {
        if (maxChars > 0 && content.length > maxChars) {
            this.logger.debug(`Truncating content from ${content.length} to ${maxChars} chars.`)
            return content.substring(0, maxChars)
        }
        return content
    }

    /**
     * Injects dynamic data into a prompt template.
     */
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
            .replace(/\${content}/g, data.content)
            .replace(/\${username}/g, data.username)
            .replace(/\${displayName}/g, data.displayName)
            .replace(/\${maxValue}/g, String(data.maxValue))
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
        const fallbackName = forumUser.forum_username ?? String(forumUser.user_id)
        return {
            username: userData?.username ?? fallbackName,
            displayName: userData?.displayName ?? fallbackName,
        }
    }

    /**
     * Generates a score for a single user's aggregated activity.
     *
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
        projectId: number,
        signalStrengthId: number,
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
            explained_reasoning: aiScore.explained_reasoning,
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
