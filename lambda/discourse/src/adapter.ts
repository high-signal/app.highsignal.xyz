import { Logger } from "winston";
import { SupabaseClient } from "@supabase/supabase-js";

import {
    AdapterRuntimeConfig,
    PlatformAdapter,
    ForumUser,
    IAiOrchestrator,
    AiConfig,
} from "@shared/types";
import {
    getForumUsersForProject,
    getLegacySignalConfig,
    getRawScoreForUser,
    saveScore,
    getRawScoresForUser,
} from "@shared/db";
import { DiscourseAdapterConfig, DiscourseAdapterRuntimeConfig } from "./config";
import { fetchUserActivity } from "./apiClient";
import { stripHtml } from "@shared/utils/htmlStripper";
import { DiscourseUserActivity, DiscourseUserAction } from "./types";

export class DiscourseAdapter implements PlatformAdapter<DiscourseAdapterConfig> {
    private supabase: SupabaseClient;
    private aiOrchestrator: IAiOrchestrator;
    private config: DiscourseAdapterRuntimeConfig;
    private logger: Logger;

    constructor(
        logger: Logger,
        aiOrchestrator: IAiOrchestrator,
        supabase: SupabaseClient,
        config: DiscourseAdapterRuntimeConfig,
    ) {
        this.supabase = supabase;
        this.aiOrchestrator = aiOrchestrator;
        this.config = config;
        this.logger = logger;
        this.logger.info("[DiscourseAdapter] Initialized.");
    }

    public async processUser(
        userId: string,
        projectId: string,
        aiConfig: AiConfig,
    ): Promise<void> {
        const numericUserId = parseInt(userId, 10);
        if (isNaN(numericUserId)) {
            this.logger.error(`[DiscourseAdapter] Invalid user ID: ${userId}. Must be a numeric string.`);
            return;
        }

        const forumUsers = await getForumUsersForProject(this.supabase, projectId, [numericUserId]);
        if (forumUsers.length === 0) {
            this.logger.warn(`[DiscourseAdapter] User with ID ${userId} not found for project ${projectId}.`);
            return;
        }

        const user = forumUsers[0];
        if (!user.forum_username) {
            this.logger.warn(
                `[DiscourseAdapter] User with ID ${user.user_id} has no forum_username. Skipping processing.`,
            );
            return;
        }

        this.logger.info(
            `[DiscourseAdapter] Starting analysis for user ${user.user_id} (forum: ${user.forum_username}) on project ${projectId}`,
        );

        try {
            await this.setLastChecked(user.user_id, projectId);

            const userActivity = await fetchUserActivity(user.forum_username, this.config);
            this.logger.info(
                `[DiscourseAdapter] Fetched ${userActivity?.user_actions.length ?? 0} actions for user ${user.forum_username}.`,
            );

            const signalConfig = await getLegacySignalConfig(
                this.supabase,
                this.config.SIGNAL_STRENGTH_ID,
                projectId,
            );
            if (!signalConfig) {
                this.logger.error(
                    `[DiscourseAdapter] Could not find signal config for signal strength ID ${this.config.SIGNAL_STRENGTH_ID} and project ID ${projectId}.`,
                );
                return;
            }

            await this.generateRawScoresForUser(user, userActivity, signalConfig, projectId);

            this.logger.info(`[DiscourseAdapter] Phase 3: Generating smart score for user ${user.user_id}.`);
            const recentRawScores = await getRawScoresForUser(
                this.supabase,
                user.user_id,
                projectId,
                this.config.SIGNAL_STRENGTH_ID,
            );

            if (recentRawScores.length === 0) {
                this.logger.info(
                    `[DiscourseAdapter] No raw scores found for user ${user.user_id}. Skipping smart score generation.`,
                );
                await this.clearLastChecked(user.user_id, projectId);
                return;
            }

                        const smartScoreOutput = await this.aiOrchestrator.generateSmartScoreSummary(
                user,
                recentRawScores,
                signalConfig,
                projectId,
            );

            if (smartScoreOutput) {
                await saveScore(this.supabase, {
                    ...smartScoreOutput,
                    user_id: user.user_id,
                    project_id: projectId,
                    signal_strength_id: this.config.SIGNAL_STRENGTH_ID,
                });
                this.logger.info(`[DiscourseAdapter] Successfully saved smart score for user ${user.user_id}.`);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(
                `[DiscourseAdapter] An unexpected error occurred while processing user ${user.user_id}: ${message}`,
            );
        } finally {
            await this.clearLastChecked(user.user_id, projectId);
            this.logger.info(`[DiscourseAdapter] Finished analysis for user ${user.user_id}.`);
        }
    }

    private groupActivityByDay(actions: DiscourseUserAction[]): Record<string, DiscourseUserAction[]> {
        const dailyActions: Record<string, DiscourseUserAction[]> = {};
        for (const action of actions) {
            const originalTimestamp = action.created_at;
            const date = originalTimestamp.split("T")[0];
            this.logger.info(`[DIAGNOSTIC] Grouping action: timestamp=${originalTimestamp}, date=${date}`);
            if (!dailyActions[date]) {
                dailyActions[date] = [];
            }
            dailyActions[date].push(action);
        }
        return dailyActions;
    }

    private async generateRawScoresForUser(
        user: ForumUser,
        userActivity: DiscourseUserActivity | null,
        signalConfig: AiConfig,
        projectId: string,
    ): Promise<void> {
        let logs = `Analyzing user: ${user.forum_username || user.user_id}\n`;
        if (!userActivity || userActivity.user_actions.length === 0) {
            this.logger.info(`No activity for user ${user.forum_username}. Skipping raw score generation.`);
            return;
        }
        logs += `Fetched ${userActivity.user_actions.length} total actions from API.\n`;

        const lookbackDays = signalConfig.previous_days || 30;
        const dateCutoff = new Date();
        dateCutoff.setDate(dateCutoff.getDate() - lookbackDays);

        const recentActions = userActivity.user_actions.filter(
            (action) => new Date(action.created_at) >= dateCutoff,
        );

        if (recentActions.length === 0) {
            this.logger.info(`No recent activity for user ${user.forum_username} in the last ${lookbackDays} days.`);
            return;
        }
        logs += `Found ${recentActions.length} actions in the last ${lookbackDays} days.\n`;

        const dailyActions = this.groupActivityByDay(recentActions);
        logs += `Grouped actions into ${Object.keys(dailyActions).length} unique days.\n`;

        for (const [dayStr, actions] of Object.entries(dailyActions)) {
            if (actions.length === 0) {
                continue;
            }
            const existingRawScore = await getRawScoreForUser(
                this.supabase,
                user.user_id,
                projectId,
                this.config.SIGNAL_STRENGTH_ID,
                dayStr,
            );

            if (existingRawScore) {
                this.logger.info(
                    `[DiscourseAdapter] Raw score for user ${user.user_id} on ${dayStr} already exists. Skipping.`,
                );
                continue;
            }

            this.logger.info(`Generating raw score for user ${user.user_id} on ${dayStr}`);
            this.logger.info(`[DIAGNOSTIC] Passing ${actions.length} actions to orchestrator for day ${dayStr}. Actions: ${JSON.stringify(actions.map(a => ({ post_id: a.post_id, created_at: a.created_at })), null, 2)}`);
            const dailyLog = logs + `Analyzing ${actions.length} actions for day ${dayStr}.\n`;

            const score = await this.aiOrchestrator.generateRawScores(
                user,
                dayStr,
                JSON.stringify(JSON.parse(JSON.stringify(actions)), null, 2),
                dailyLog,
                signalConfig,
                projectId
            );

            if (score) {
                await saveScore(this.supabase, {
                    ...score,
                    user_id: user.user_id,
                    project_id: projectId,
                    signal_strength_id: this.config.SIGNAL_STRENGTH_ID,
                });
                this.logger.info(`Saved raw score for user ${user.user_id} on ${dayStr}`);
            } else {
                this.logger.warn(`AI Orchestrator returned no score for user ${user.user_id} on ${dayStr}`);
            }
        }
    }

    private async clearLastChecked(userId: number, projectId: string): Promise<void> {
        this.logger.info(`Clearing last_checked for user ${userId} and project ${projectId}`);
        try {
            const { error } = await this.supabase
                .from("user_signal_strengths")
                .delete()
                .eq("request_id", `last_checked_${userId}_${projectId}_${this.config.SIGNAL_STRENGTH_ID}`);

            if (error) {
                throw error;
            }

            this.logger.info(`Successfully cleared last_checked for user ${userId}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error clearing last_checked for user ${userId}: ${message}`);
        }
    }

    private async setLastChecked(userId: number, projectId: string): Promise<void> {
        this.logger.info(`Setting last_checked for user ${userId} and project ${projectId}`);
        try {
            await saveScore(this.supabase, {
                user_id: userId,
                project_id: projectId,
                signal_strength_id: this.config.SIGNAL_STRENGTH_ID,
                last_checked: Math.floor(Date.now() / 1000),
                request_id: `last_checked_${userId}_${projectId}_${this.config.SIGNAL_STRENGTH_ID}`,
                day: new Date().toISOString().split("T")[0],
                created: Math.floor(Date.now() / 1000),
            });
            this.logger.info(`Successfully set last_checked for user ${userId}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error setting last_checked for user ${userId}: ${message}`);
        }
    }
}
