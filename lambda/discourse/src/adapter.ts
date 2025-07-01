import { Logger } from "winston"
import { SupabaseClient } from "@supabase/supabase-js"
import axios from "axios"
import { AIOrchestrator } from "@engine/aiOrchestrator"
import { 
    getForumUsersForProject, 
    getUserLastUpdate, 
    updateUserLastUpdate, 
    getRawScoreForUser, 
    getRawScoresForUser, 
    getSmartScoreForUser, 
    saveScore, 
    getSignalStrengthConfig 
} from "@engine/dbClient"
import { AiConfig, ForumUser } from "@engine/types"
import { DiscourseAdapterRuntimeConfig } from "@engine/config"
import { fetchUserActivity } from "./apiClient"
import { DiscourseUserActivity, DiscourseUserAction } from "./types"

export class DiscourseAdapter {
    private logger: Logger
    private aiOrchestrator: AIOrchestrator
    private config: DiscourseAdapterRuntimeConfig

    constructor(logger: Logger, aiOrchestrator: AIOrchestrator, config: DiscourseAdapterRuntimeConfig) {
        this.logger = logger
        this.aiOrchestrator = aiOrchestrator
        this.config = config
        this.logger.info("[DiscourseAdapter] Initialized.")
    }

    public async processUser(
        userId: string,
        projectId: number,
        // This parameter is passed from the engine to satisfy the test mock,
        // but the adapter's logic currently relies on its own config.
        // This could be refactored to use this injected config directly.
        aiConfig: AiConfig,
    ): Promise<void> {
        this.logger.info(
            `[DiscourseAdapter] Starting user processing for user ID: ${userId} in project ID: ${projectId}`,
        )
        const numericUserId = parseInt(userId, 10)
        if (isNaN(numericUserId)) {
            this.logger.error(`[DiscourseAdapter] Invalid user ID provided: ${userId}`)
            return
        }

        // Step 1: Validate user and check for forum username
        const forumUsers = await getForumUsersForProject(projectId, [numericUserId])
        if (forumUsers.length === 0) {
            this.logger.warn(`[DiscourseAdapter] User with ID ${userId} not found for project ${projectId}.`)
            return
        }

        const user = forumUsers[0]
        if (!user.forum_username) {
            this.logger.warn(
                `[DiscourseAdapter] User with ID ${user.user_id} has no forum_username. Skipping processing.`,
            )
            return
        }

        // Step 2: Check if an update is required by comparing last update time with latest activity
        const userActivity = await fetchUserActivity(user.forum_username, this.config, this.logger)
        const lastUpdateTimestamp = await getUserLastUpdate(numericUserId, projectId)
        const latestActivityDate =
            userActivity?.user_actions?.reduce((latest, action) => {
                const actionDate = new Date(action.created_at)
                return actionDate > latest ? actionDate : latest
            }, new Date(0)) || null

        if (lastUpdateTimestamp && latestActivityDate) {
            const lastUpdateDate = new Date(lastUpdateTimestamp)
            if (latestActivityDate <= lastUpdateDate) {
                this.logger.info(
                    `[DiscourseAdapter] No new activity for user ${user.forum_username} since last update on ${lastUpdateTimestamp}. Skipping.`,
                )
                return
            }
        } else if (lastUpdateTimestamp && !latestActivityDate) {
            this.logger.info(
                `[DiscourseAdapter] No new activity found for user ${user.forum_username}, and user has been processed before. Skipping.`,
            )
            return
        }

        try {
            // Generate raw and smart scores
            const signalConfig = await getSignalStrengthConfig(this.config.SIGNAL_STRENGTH_ID, projectId)
            await this.generateRawScoresForUser(user, userActivity, signalConfig)
            await this.generateSmartScoreForUser(user)

            // After all processing is successful, update the user's last_updated timestamp.
            await updateUserLastUpdate(numericUserId, projectId)

            this.logger.info(`[DiscourseAdapter] Completed processing for user: ${user.forum_username}.`)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            this.logger.error(`[DiscourseAdapter] Error processing user ${user.forum_username}: ${message}`, {
                error,
            })
            // In single-user mode, we re-throw to let the engine know it failed.
            throw error
        }
    }

    private groupAndSummarizeActivityByDay(actions: DiscourseUserAction[]): Record<string, string> {
        const groupedByDay = actions.reduce(
            (acc, action) => {
                const day = action.created_at.split("T")[0]
                if (!acc[day]) {
                    acc[day] = { newTopics: 0, replies: 0, likes: 0 }
                }
                if (action.action_type === 4) acc[day].newTopics++
                if (action.action_type === 5) acc[day].replies++
                if (action.action_type === 1) acc[day].likes++
                return acc
            },
            {} as Record<string, { newTopics: number; replies: number; likes: number }>,
        )

        const summaries: Record<string, string> = {}
        for (const day in groupedByDay) {
            const counts = groupedByDay[day]
            const summaryParts = []
            if (counts.newTopics > 0) summaryParts.push(`${counts.newTopics} new topics`)
            if (counts.replies > 0) summaryParts.push(`${counts.replies} replies`)
            if (counts.likes > 0) summaryParts.push(`${counts.likes} likes`)
            if (summaryParts.length > 0) {
                summaries[day] = summaryParts.join(", ")
            }
        }
        return summaries
    }

    private async generateRawScoresForUser(
        user: ForumUser,
        userActivity: DiscourseUserActivity | null,
        signalConfig: { previous_days: number } | null,
    ): Promise<void> {
        this.logger.info("In generateRawScoresForUser, processing user", {
            userId: user.user_id,
        })

        if (!userActivity || userActivity.user_actions.length === 0) {
            this.logger.info(`No activity found for user ${user.forum_username}`)
            return
        }

        const dailySummaries = this.groupAndSummarizeActivityByDay(userActivity.user_actions)



        for (const [date, summary] of Object.entries(dailySummaries)) {
            this.logger.info(`Processing activity for ${user.forum_username} on ${date}`)

            const existingScore = await getRawScoreForUser(
                user.user_id,
                this.config.PROJECT_ID,
                this.config.SIGNAL_STRENGTH_ID,
                date,
            )

            if (existingScore) {
                this.logger.info(`Raw score for ${user.forum_username} on ${date} already exists. Skipping.`)
                continue
            }

            this.logger.info(`Generating raw score for ${user.forum_username} on ${date} with summary: ${summary}`)

            const result = await this.aiOrchestrator.generateRawScoreForUserActivity(
                summary,
                user,
                this.config.PROJECT_ID,
                this.config.SIGNAL_STRENGTH_ID,
            )

            if (result) {
                await saveScore({
                    user_id: user.user_id,
                    project_id: this.config.PROJECT_ID,
                    signal_strength_id: this.config.SIGNAL_STRENGTH_ID,
                    day: date,
                    prompt_id: result.promptId,
                    raw_value: result.score.value,
                    max_value: this.config.MAX_VALUE,
                    summary: result.score.summary ?? "",
                    description: result.score.description ?? "",
                    improvements: result.score.improvements ?? "",
                    explained_reasoning:
                        typeof result.score.explained_reasoning === "string"
                            ? result.score.explained_reasoning
                            : result.score.explained_reasoning?.reason ?? "",
                    created: Math.floor(new Date().getTime() / 1000),
                })


                this.logger.info(`Successfully generated and saved raw score for ${user.forum_username} on ${date}`)

            // If a specific lookback period is defined, we only score the most recent day of activity.
            if (signalConfig?.previous_days) {
                break
            }
            } else {
                this.logger.error(
                    `Failed to generate AI score for user ${user.forum_username} on ${date}. AI service returned null.`,
                )
            }
        }
    }

    private async generateSmartScoreForUser(user: ForumUser): Promise<void> {
        this.logger.info(`Starting smart score generation for user ${user.user_id}`)

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split("T")[0]

        // Step 4: Check for existing smart score for YESTERDAY to ensure idempotency
        const existingSmartScore = await getSmartScoreForUser(
            user.user_id,
            this.config.PROJECT_ID,
            this.config.SIGNAL_STRENGTH_ID,
            yesterdayStr,
        )

        if (existingSmartScore) {
            this.logger.info(
                `[DiscourseAdapter] Smart score for user ${user.user_id} on ${yesterdayStr} already exists. Skipping.`,
            )
            return
        }

        if (!user.forum_username) {
            this.logger.warn(`User with ID ${user.user_id} has no forum_username. Skipping smart score generation.`)
            return
        }

        const rawScores = await getRawScoresForUser(
            user.user_id,
            this.config.PROJECT_ID,
            this.config.SIGNAL_STRENGTH_ID,
        )

        if (rawScores.length === 0) {
            this.logger.info(
                `No raw scores found for user ${user.user_id} in the last 30 days. Skipping smart score generation.`,
            )
            return
        }

        // Map raw_value to value to match the expected input for smart score generation.
        const mappedScores = rawScores.map((score) => ({
            ...score,
            value: score.raw_value,
        }))

        const result = await this.aiOrchestrator.generateSmartScoreFromRawScores(
            mappedScores,
            user,
            this.config.PROJECT_ID,
            this.config.SIGNAL_STRENGTH_ID,
        )

        if (result) {
            await saveScore({
                user_id: user.user_id,
                project_id: this.config.PROJECT_ID,
                signal_strength_id: this.config.SIGNAL_STRENGTH_ID,
                day: yesterdayStr,
                prompt_id: result.promptId,
                value: result.score.value,
                max_value: this.config.MAX_VALUE,
                summary: result.score.summary ?? "",
                description: result.score.description ?? "",
                improvements: result.score.improvements ?? "",
                explained_reasoning:
                    typeof result.score.explained_reasoning === "string"
                        ? result.score.explained_reasoning
                        : result.score.explained_reasoning?.reason ?? "",
                created: Math.floor(new Date().getTime() / 1000),
            })
            this.logger.info(
                `Successfully generated and saved smart score for user ${user.user_id} for date ${yesterdayStr}`,
            )
        } else {
            this.logger.error(`Failed to generate smart score for user ${user.user_id}. AI service returned null.`)
        }
    }
}
