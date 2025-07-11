import { Logger } from "winston"
import { SupabaseClient } from "@supabase/supabase-js"

import { AdapterRuntimeConfig, PlatformAdapter, ForumUser, IAiOrchestrator, AiConfig } from "@shared/types"
import {
    getForumUsersForProject,
    getLegacySignalConfig,
    getRawScoreForUser,
    saveScore,
    getRawScoresForUser,
    deleteSmartScoresForUser,
    deleteRawScore,
    updateForumUserLastUpdated,
    deleteDuplicateScores,
} from "@shared/db"
import { DiscourseAdapterConfig, DiscourseAdapterRuntimeConfig } from "./config"
import { fetchUserActivity } from "./apiClient"
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

    public async processUser(userId: string, projectId: string, aiConfig: AiConfig): Promise<void> {
        const numericUserId = parseInt(userId, 10)
        if (isNaN(numericUserId)) {
            this.logger.error(`[DiscourseAdapter] Invalid user ID: ${userId}. Must be a numeric string.`)
            return
        }

        const forumUsers = await getForumUsersForProject(this.supabase, projectId, [numericUserId])
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

        this.logger.info(
            `[DiscourseAdapter] Starting analysis for user ${user.user_id} (forum: ${user.forum_username}) on project ${projectId}`,
        )

        try {
            await this.setLastChecked(user.user_id, projectId)

            const userActivity = await fetchUserActivity(user.forum_username, this.config)
            this.logger.info(
                `[DiscourseAdapter] Fetched ${userActivity?.user_actions.length ?? 0} actions for user ${user.forum_username}.`,
            )

            const signalConfig = await getLegacySignalConfig(this.supabase, this.config.SIGNAL_STRENGTH_ID, projectId)
            if (!signalConfig) {
                this.logger.error(
                    `[DiscourseAdapter] Could not find signal config for signal strength ID ${this.config.SIGNAL_STRENGTH_ID} and project ID ${projectId}.`,
                )
                return
            }

            await this.generateRawScoresForUser(user, userActivity, signalConfig, projectId)

            this.logger.info(`[DiscourseAdapter] Phase 3: Generating smart score for user ${user.user_id}.`)
            const recentRawScores = await getRawScoresForUser(
                this.supabase,
                user.user_id,
                projectId,
                this.config.SIGNAL_STRENGTH_ID,
            )

            if (recentRawScores.length === 0) {
                this.logger.info(
                    `[DiscourseAdapter] No raw scores found for user ${user.user_id}. Skipping smart score generation.`,
                )
                // Even if we skip smart score, we should update the last_updated timestamp
            } else {
                const smartScoreOutput = await this.aiOrchestrator.generateSmartScoreSummary(
                    user,
                    recentRawScores,
                    signalConfig,
                    projectId,
                )

                if (smartScoreOutput) {
                    const day = new Date().toISOString().split("T")[0]
                    const scoreToSave = {
                        ...smartScoreOutput,
                        user_id: user.user_id,
                        project_id: projectId.toString(),
                        signal_strength_id: this.config.SIGNAL_STRENGTH_ID,
                        day,
                        request_id: `discourse_smart_score_${user.user_id}_${projectId}_${day}`,
                    }

                    // Save the new score first. The `saveScore` function uses an upsert on
                    // `request_id` to prevent exact duplicates.
                    await saveScore(this.supabase, scoreToSave)
                    this.logger.info(`[DiscourseAdapter] Saved smart score for user ${user.user_id}.`)

                    // To handle race conditions where the same analysis might run twice,
                    // we immediately delete any other scores for the same user, project, and day
                    // that do not match the `request_id` of the one we just saved.
                    // This ensures that only the result of the latest analysis run is kept.

                    if (scoreToSave.day && scoreToSave.request_id) {
                        const deletedCount = await deleteDuplicateScores(this.supabase, {
                            userId: user.user_id.toString(),
                            projectId: projectId.toString(),
                            signalStrengthId: this.config.SIGNAL_STRENGTH_ID,
                            day: scoreToSave.day,
                            keepRequestId: scoreToSave.request_id,
                            isRawScore: false,
                        })

                        if (deletedCount > 0) {
                            this.logger.info(
                                `[DiscourseAdapter] Deleted ${deletedCount} duplicate smart scores for user ${user.user_id}.`,
                            )
                        }
                    } else {
                        this.logger.warn(
                            `[DiscourseAdapter] Could not delete duplicate scores for user ${user.user_id} due to missing day or request_id.`,
                        )
                    }
                }
            }

            // Re-implement legacy functionality: update forum_users.last_updated
            if (userActivity && userActivity.user_actions.length > 0) {
                const latestActivityDate = userActivity.user_actions.reduce(
                    (latest: Date, action: DiscourseUserAction) => {
                        const actionDate = new Date(action.updated_at)
                        return actionDate > latest ? actionDate : latest
                    },
                    new Date(0),
                )

                if (latestActivityDate.getTime() > 0) {
                    this.logger.info(
                        `[DiscourseAdapter] Updating last_updated for user ${user.user_id} to ${latestActivityDate.toISOString()}`,
                    )
                    await updateForumUserLastUpdated(
                        this.supabase,
                        projectId,
                        user.user_id,
                        latestActivityDate.toISOString(),
                    )
                }
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            this.logger.error(
                `[DiscourseAdapter] An error occurred during the analysis of user ${user.user_id}: ${message}`,
                { error },
            )
        } finally {
            await this.clearLastChecked(user.user_id, projectId)
            this.logger.info(`[DiscourseAdapter] Finished analysis for user ${user.user_id}.`)
        }
    }

    private groupActivityByDay(actions: DiscourseUserAction[]): Record<string, DiscourseUserAction[]> {
        const groupedActions: Record<string, DiscourseUserAction[]> = {}
        for (const action of actions) {
            // Group by a formatted date string from 'updated_at'.
            const day = new Date(action.updated_at || action.created_at).toISOString().split("T")[0]
            if (!groupedActions[day]) {
                groupedActions[day] = []
            }
            groupedActions[day].push(action)
        }
        return groupedActions
    }

    private async generateRawScoresForUser(
        user: ForumUser,
        userActivity: DiscourseUserActivity | null,
        signalConfig: AiConfig,
        projectId: string,
    ): Promise<void> {
        if (!userActivity || !userActivity.user_actions || userActivity.user_actions.length === 0) {
            this.logger.warn(
                `[DiscourseAdapter] No actions found for user ${user.user_id}. Skipping raw score generation.`,
            )
            return
        }

        const lookbackDays = signalConfig.previous_days ?? 0
        const authPostId = user.auth_post_id
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - lookbackDays)

        this.logger.info(
            `[DIAGNOSTIC] Filtering actions for user ${user.user_id}: lookback_days=${lookbackDays}, auth_post_id=${authPostId || "N/A"}, cutoff_date=${cutoffDate.toISOString()}`,
        )
        this.logger.info(`[DIAGNOSTIC] Total actions before filtering: ${userActivity.user_actions.length}`)

        const filteredActions = userActivity.user_actions.filter((action) => {
            const activityDate = new Date(action.updated_at || action.created_at)
            const isAfterCutoff = activityDate > cutoffDate
            const isNotAuthPost = authPostId && action.post_id ? action.post_id !== Number(authPostId) : true
            return isAfterCutoff && isNotAuthPost
        })

        this.logger.info(`[DIAGNOSTIC] Actions after filtering: ${filteredActions.length}`)

        if (filteredActions.length === 0) {
            this.logger.info(
                `[DiscourseAdapter] No recent activity for user ${user.forum_username} in the last ${lookbackDays} days.`,
            )
            return
        }

        const dailyActions = this.groupActivityByDay(filteredActions)
        this.logger.info(`[DIAGNOSTIC] Grouped actions into ${Object.keys(dailyActions).length} unique days.`)

        for (const [dayStr, actions] of Object.entries(dailyActions)) {
            if (actions.length === 0) continue

            this.logger.info(`[DIAGNOSTIC] Checking for existing raw score for user ${user.user_id} on day ${dayStr}`)
            const existingRawScore = await getRawScoreForUser(
                this.supabase,
                user.user_id,
                projectId,
                this.config.SIGNAL_STRENGTH_ID,
                dayStr,
            )

            if (existingRawScore) {
                this.logger.info(
                    `[DiscourseAdapter] Raw score for user ${user.user_id} on ${dayStr} already exists. Deleting it before regeneration.`,
                )
                await deleteRawScore(this.supabase, user.user_id, projectId, this.config.SIGNAL_STRENGTH_ID, dayStr)
            }

            this.logger.info(
                `[DiscourseAdapter] Generating raw score for user ${user.user_id} on ${dayStr} with ${actions.length} actions.`,
            )
            const dailyLog = `Analyzing ${actions.length} actions for day ${dayStr}.\n`

            const score = await this.aiOrchestrator.generateRawScores(
                user,
                dayStr,
                JSON.stringify(actions, null, 2),
                dailyLog,
                signalConfig,
                projectId,
            )

            if (score) {
                await saveScore(this.supabase, {
                    ...score,
                    user_id: user.user_id,
                    project_id: projectId,
                    signal_strength_id: this.config.SIGNAL_STRENGTH_ID,
                })
                this.logger.info(`[DiscourseAdapter] Saved raw score for user ${user.user_id} on ${dayStr}`)
            } else {
                this.logger.warn(
                    `[DiscourseAdapter] AI Orchestrator returned no score for user ${user.user_id} on ${dayStr}`,
                )
            }
        }
    }

    private async clearLastChecked(userId: number, projectId: string): Promise<void> {
        this.logger.info(`[DiscourseAdapter] Clearing last_checked for user ${userId} and project ${projectId}`)
        try {
            const { error } = await this.supabase
                .from("user_signal_strengths")
                .delete()
                .eq("request_id", `last_checked_${userId}_${projectId}_${this.config.SIGNAL_STRENGTH_ID}`)

            if (error) {
                throw error
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            this.logger.error(`[DiscourseAdapter] Error clearing last_checked for user ${userId}: ${message}`)
        }
    }

    private async setLastChecked(userId: number, projectId: string): Promise<void> {
        this.logger.info(`[DiscourseAdapter] Setting last_checked for user ${userId} and project ${projectId}`)
        try {
            await saveScore(this.supabase, {
                user_id: userId,
                project_id: projectId,
                signal_strength_id: this.config.SIGNAL_STRENGTH_ID,
                last_checked: Math.floor(Date.now() / 1000),
                request_id: `last_checked_${userId}_${projectId}_${this.config.SIGNAL_STRENGTH_ID}`,
                day: new Date().toISOString().split("T")[0],
                created: Math.floor(Date.now() / 1000),
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            this.logger.error(`[DiscourseAdapter] Error setting last_checked for user ${userId}: ${message}`)
        }
    }
}
