import { Logger } from "winston"
import { SupabaseClient } from "@supabase/supabase-js"

import {
    AdapterRuntimeConfig,
    PlatformAdapter,
    ForumUser,
    IAiOrchestrator,
    AiConfig,
    DailyActivityLog,
} from "@shared/types"
import { saveScore, getRawScoresForUser, deleteDuplicateScores } from "@shared/db"
import { DiscourseAdapterConfig, DiscourseAdapterRuntimeConfig } from "./config"
import { fetchUserActivity } from "./apiClient"
import { DiscourseUserAction } from "./types"
import { ScoreManager } from "../../engine/src/scoreManager"

/**
 * The DiscourseAdapter is responsible for fetching user data from the Discourse API,
 * processing it, generating AI-driven scores, and saving the results to the database.
 * It implements the PlatformAdapter interface, providing a standardized way for the
 * engine to interact with the Discourse platform.
 */
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

    public async fetchActivity(user: ForumUser, signalConfig: AiConfig): Promise<DailyActivityLog> {
        this.logger.info(`[DiscourseAdapter] Fetching activity for user ${user.forum_username}`)

        const userActivity = await fetchUserActivity(user.forum_username!, signalConfig, this.logger)
        if (!userActivity || userActivity.user_actions.length === 0) {
            this.logger.warn(`[DiscourseAdapter] No actions found for user ${user.user_id}.`)
            return {}
        }

        const lookbackDays = signalConfig.previous_days ?? 30
        const authPostId = user.auth_post_id
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - lookbackDays)

        const filteredActions = userActivity.user_actions.filter((action) => {
            const activityDate = new Date(action.updated_at || action.created_at)
            const isAfterCutoff = activityDate > cutoffDate
            const isNotAuthPost = authPostId && action.post_id ? action.post_id !== Number(authPostId) : true
            return isAfterCutoff && isNotAuthPost
        })

        if (filteredActions.length === 0) {
            this.logger.info(
                `[DiscourseAdapter] No recent activity for user ${user.forum_username} in the last ${lookbackDays} days.`,
            )
            return {}
        }

        return this.groupActivityByDay(filteredActions)
    }

    public async processUser(user: ForumUser, projectId: string): Promise<void> {
        if (!user.forum_username) {
            this.logger.warn(
                `[DiscourseAdapter] User with ID ${user.user_id} has no forum_username. Skipping processing.`,
            )
            return
        }

        this.logger.info(
            `[DiscourseAdapter] Starting analysis for user ${user.user_id} (forum: ${user.forum_username}) on project ${projectId}`,
        )

        try {
            const scoreManager = new ScoreManager(
                this.supabase,
                this.logger,
                this.aiOrchestrator,
                this.config.SIGNAL_STRENGTH_ID,
            )
            await scoreManager.generateScoresForUser(this, user, projectId)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            this.logger.error(
                `[DiscourseAdapter] An error occurred during the analysis of user ${user.user_id}: ${message}`,
                { error },
            )
        }

        this.logger.info(
            `[DiscourseAdapter] Finished analysis for user ${user.user_id} (forum: ${user.forum_username}) on project ${projectId}`,
        )
    }

    private groupActivityByDay(actions: DiscourseUserAction[]): Record<string, DiscourseUserAction[]> {
        const groupedActions: Record<string, DiscourseUserAction[]> = {}

        for (const action of actions) {
            // Use updated_at as the primary timestamp, fallback to created_at.
            const timestamp = action.updated_at || action.created_at
            const day = timestamp.split("T")[0] // Extract YYYY-MM-DD

            if (!groupedActions[day]) {
                groupedActions[day] = []
            }
            groupedActions[day].push(action)
        }

        return groupedActions
    }
}
