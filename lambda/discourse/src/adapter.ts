import { Logger } from "winston"
import { SupabaseClient } from "@supabase/supabase-js"
import axios from "axios"

import {
    AdapterConfig,
    AdapterRuntimeConfig,
    PlatformAdapter,
    PlatformOutput,
    UserSignalStrength,
    ForumUser,
    RawScore,
    SmartScoreOutput,
    IAiOrchestrator,
    AiConfig,
} from "@shared/types"
import {
    getForumUsersForProject,
    getUserLastUpdate,
    getLegacySignalConfig,
    getRawScoreForUser,
    saveScore,
    getSmartScoreForUser,
    getRawScoresForUser,
} from "@shared/db"
import { DiscourseAdapterConfig, DiscourseAdapterRuntimeConfig } from "./config"
import { fetchUserActivity } from "./apiClient"
import { stripHtml } from "@shared/utils/htmlStripper"
import { calculateSmartScore } from "@shared/utils/smartScoreCalculator"
import { DiscourseUserActivity, DiscourseUserAction } from "./types"

export class DiscourseAdapter implements PlatformAdapter<DiscourseAdapterConfig> {
    private supabase: SupabaseClient
    private aiOrchestrator: IAiOrchestrator
    private config: DiscourseAdapterRuntimeConfig
    private logger: Logger

    constructor(
        logger: Logger,
        aiOrchestrator: IAiOrchestrator,
        supabase: SupabaseClient,
        config: DiscourseAdapterRuntimeConfig,
    ) {
        this.supabase = supabase
        this.aiOrchestrator = aiOrchestrator
        this.config = config
        this.logger = logger
        this.logger.info("[DiscourseAdapter] Initialized.")
    }

    public async processUser(
        userId: string,
        projectId: string,
        aiConfig: AiConfig,
    ): Promise<void> {
        const numericUserId = parseInt(userId, 10)
        if (isNaN(numericUserId)) {
            this.logger.error(`[DiscourseAdapter] Invalid user ID: ${userId}. Must be a numeric string.`)
            return
        }
        const forumUsers = await getForumUsersForProject(this.supabase, projectId, [numericUserId])
        if (forumUsers.length === 0) {
            console.log(`[DiscourseAdapter] User with ID ${userId} not found for project ${projectId}.`)
            return
        }

        const user = forumUsers[0]
        if (!user.forum_username) {
            console.log(
                `[DiscourseAdapter] User with ID ${user.user_id} has no forum_username. Skipping processing.`,
            )
            return
        }

        // Set the last_checked value so that the user profile page shows the loading animation
        await this.setLastChecked(user.user_id, projectId)

        console.log("\n**************************************************")
        console.log(
            `Analyzing forum user activity for user ${user.user_id} and project ${projectId} and forum username ${user.forum_username}`,
        )

        const userActivity = await fetchUserActivity(user.forum_username, this.config)

        console.log(
            `Fetching forum activity data for ${user.forum_username} (forum username: ${user.forum_username})`,
        )

        try {
            const signalConfig = await getLegacySignalConfig(
                this.supabase,
                this.config.SIGNAL_STRENGTH_ID,
                projectId,
            )
            if (!signalConfig) {
                console.error(
                    `[DiscourseAdapter] Could not find signal config for signal strength ID ${this.config.SIGNAL_STRENGTH_ID} and project ID ${projectId}.`,
                )
                return
            }

            await this.generateRawScoresForUser(user, userActivity, signalConfig, projectId)
            await this.generateSmartScoreForUser(user, projectId)

            console.log(`Analysis complete.`)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            console.error(
                `[DiscourseAdapter] An unexpected error occurred while processing user ${user.forum_username}: ${message}`,
                {
                    stack: error instanceof Error ? error.stack : undefined,
                },
            )
        }
    }

    private groupActivityContentByDay(actions: DiscourseUserAction[]): Record<string, string> {
        const dailyContent: Record<string, string[]> = {}

        for (const action of actions) {
            // Guard against actions with no content, which don't contribute to scoring.
            if (!action.cooked) {
                continue
            }

            const date = action.created_at.split("T")[0]
            if (!dailyContent[date]) {
                dailyContent[date] = []
            }
            const strippedContent = stripHtml(action.cooked)
            if (strippedContent) {
                dailyContent[date].push(strippedContent)
            }
        }

        const aggregatedDailyContent: Record<string, string> = {}
        for (const [date, contents] of Object.entries(dailyContent)) {
            // Join with newlines to replicate the legacy script's aggregation.
            aggregatedDailyContent[date] = contents.join("\n\n")
        }

        return aggregatedDailyContent
    }

    private async generateRawScoresForUser(
        user: ForumUser,
        userActivity: DiscourseUserActivity | null,
        signalConfig: AiConfig,
        projectId: string,
    ): Promise<void> {
        if (!userActivity || userActivity.user_actions.length === 0) {
            console.log(`No activity for user ${user.forum_username}. Skipping raw score generation.`)
            return
        }

        console.log(
            `Processed ${userActivity.user_actions.length} activities for ${user.forum_username} (forum username: ${user.forum_username})`,
        )

        const lookbackDays = signalConfig.previous_days ?? 180
        const dateCutoff = new Date()
        dateCutoff.setDate(dateCutoff.getDate() - lookbackDays)

        const recentActions = userActivity.user_actions.filter(
            (action) => new Date(action.created_at) >= dateCutoff,
        )
        console.log(`Filtered activity data to the past ${lookbackDays} days: ${recentActions.length}`)

        const dailyContent = this.groupActivityContentByDay(recentActions)
        console.log(`Number of days to analyze for raw score calculation: ${Object.keys(dailyContent).length}`)

        for (const date in dailyContent) {
            const content = dailyContent[date]

            const existingScore = await getRawScoreForUser(
                this.supabase,
                user.user_id,
                projectId,
                this.config.SIGNAL_STRENGTH_ID,
                date,
            )
            if (existingScore) {
                console.log(`Raw score for ${user.forum_username} on ${date} already exists. Skipping.`)
                continue
            }

            console.log(`Day ${date} analysis started...`)

            const result = await this.aiOrchestrator.generateRawScoreForUserActivity(
                content,
                user,
                projectId,
                this.config.SIGNAL_STRENGTH_ID,
                this.config.aiConfig,
            )

            if (result) {
                console.log(`model ${result.model}`)
                console.log(`Making OpenAI API call...`)
                const logs = `forum_username: ${user.forum_username}\nTotal API activities:  ${userActivity?.user_actions.length}\nActivity past 180 days: ${recentActions.length}\nUnique activity days: ${Object.keys(dailyContent).length}\nDay ${date} activity: ${content.length}\n\nuserDataString.length: ${content.length}\ntruncatedData.length: ${content.length}`

                await saveScore(this.supabase, {
                    user_id: user.user_id,
                    project_id: projectId,
                    signal_strength_id: this.config.SIGNAL_STRENGTH_ID,
                    day: date,
                    prompt_id: result.promptId,
                    raw_value: result.score.value,
                    max_value: signalConfig.maxValue,
                    summary: result.score.summary,
                    description: result.score.description,
                    improvements: result.score.improvements,
                    explained_reasoning: typeof result.score.explained_reasoning === 'string' ? result.score.explained_reasoning : result.score.explained_reasoning.reason,
                    created: Math.floor(new Date().getTime() / 1000),
                    model: result.model,
                    temperature: result.temperature,
                    prompt_tokens: result.promptTokens,
                    completion_tokens: result.completionTokens,
                    request_id: result.requestId,
                    logs: logs,
                })

                console.log(`Analysis complete for user: ${user.forum_username}`)
                console.log(`Updating database for user ${user.forum_username}`)
                console.log(`Successfully stored signal strength response in database for ${user.forum_username}`)
                console.log(`User data successfully updated for day ${date}\n`)
            } else {
                console.error(
                    `Failed to generate AI score for user ${user.forum_username} on ${date}. AI service returned null.`,
                )
            }
        }
    }

    private async generateSmartScoreForUser(user: ForumUser, projectId: string): Promise<void> {
        const today = new Date()
        const todayStr = today.toISOString().split("T")[0]

        console.log(`Day ${todayStr} analysis started...`)

        const existingSmartScore = await getSmartScoreForUser(
            this.supabase,
            user.user_id,
            projectId,
            this.config.SIGNAL_STRENGTH_ID,
            todayStr,
        )

        if (existingSmartScore) {
            console.log(
                `[DiscourseAdapter] Smart score for user ${user.user_id} on ${todayStr} already exists. Skipping.`,
            )
            return
        }

        const rawScoresFromDb = await getRawScoresForUser(
            this.supabase,
            user.user_id,
            projectId,
            this.config.SIGNAL_STRENGTH_ID,
        )

        const rawScores: RawScore[] = rawScoresFromDb.filter(
            (score): score is RawScore => score.raw_value != null && score.max_value != null && score.day != null,
        )

        if (rawScores.length === 0) {
            console.log(
                `No valid raw scores found for user ${user.user_id} in the last 30 days. Skipping smart score generation.`,
            )
            return
        }

        const { smartScore } = calculateSmartScore(rawScores, 30)

        const result = await this.aiOrchestrator.generateSmartScoreSummary(
            user,
            rawScores,
            smartScore,
            projectId,
            this.config.SIGNAL_STRENGTH_ID,
        )

        await saveScore(this.supabase, {
            user_id: user.user_id,
            project_id: projectId,
            signal_strength_id: this.config.SIGNAL_STRENGTH_ID,
            day: todayStr,
            value: smartScore,
            max_value: 100,
            summary: result?.summary ?? "Smart score calculated based on recent activity.",
            description: result?.description ?? "",
            improvements: result?.improvements ?? "",
            explained_reasoning: result?.explained_reasoning ?? "",
            created: Math.floor(new Date().getTime() / 1000),
            prompt_id: 10, // Hardcoded from legacy data to ensure parity for now
        })

        console.log(`Analysis complete for user: ${user.forum_username}`)
        console.log(`Updating database for user ${user.forum_username}`)
        console.log(`Successfully stored signal strength response in database for ${user.forum_username}`)
        console.log(
            `Smart score successfully updated for ${user.forum_username} (forum username: ${user.forum_username})`,
        )
    }

    private async setLastChecked(userId: number, projectId: string): Promise<void> {
        this.logger.info(`Setting last_checked for user ${userId} and project ${projectId}`)
        try {
            await saveScore(this.supabase, {
                user_id: userId,
                project_id: projectId,
                signal_strength_id: this.config.SIGNAL_STRENGTH_ID,
                last_checked: Math.floor(Date.now() / 1000),
                request_id: `last_checked_${userId}_${projectId}_${this.config.SIGNAL_STRENGTH_ID}`,
                // These fields are required by the table schema but are not relevant for this marker.
                day: new Date().toISOString().split("T")[0],
                created: Math.floor(Date.now() / 1000),
            })
            this.logger.info(`Successfully set last_checked for user ${userId}`)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            this.logger.error(`Error setting last_checked for user ${userId}: ${message}`)
            // Do not re-throw; allow main processing to continue.
        }
    }
}
