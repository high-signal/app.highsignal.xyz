import { SupabaseClient } from "@supabase/supabase-js"
import { Logger } from "winston"
import {
    AiConfig,
    ForumUser,
    IAiOrchestrator,
    PlatformAdapter,
    RawScore,
    UserSignalStrength,
} from "../../shared/src/types"
import {
    deleteDuplicateScores,
    getLegacySignalConfig,
    getRawScoresForUser,
    getRawScoreForUser,
    saveScore,
} from "../../shared/src/db"

/**
 * ScoreManager is responsible for orchestrating the entire scoring process for a user.
 * It coordinates fetching platform-specific data via an adapter, generating raw and smart scores
 * via the AIOrchestrator, and interacting with the database.
 */
export class ScoreManager {
    private readonly supabase: SupabaseClient
    private readonly logger: Logger
    private readonly aiOrchestrator: IAiOrchestrator
    private readonly signalStrengthId: string

    constructor(supabase: SupabaseClient, logger: Logger, aiOrchestrator: IAiOrchestrator, signalStrengthId: string) {
        this.supabase = supabase
        this.logger = logger
        this.aiOrchestrator = aiOrchestrator
        this.signalStrengthId = signalStrengthId
    }

    public async generateScoresForUser(
        adapter: PlatformAdapter<any>,
        user: ForumUser,
        projectId: string,
    ): Promise<void> {
        this.logger.info(`[ScoreManager] Starting score generation for user ${user.user_id} on project ${projectId}`)

        // 1. Get signal configuration
        const signalConfig = await getLegacySignalConfig(this.supabase, this.signalStrengthId, projectId)
        if (!signalConfig) {
            this.logger.error(`[ScoreManager] Could not find signal config for project ${projectId}.`)
            return
        }

        // 2. Fetch platform-specific activity
        const activity = await adapter.fetchActivity(user, signalConfig)
        this.logger.info(
            `[ScoreManager] Fetched ${Object.keys(activity).length} days of activity for user ${user.user_id}.`,
        )

        // 3. Generate and save raw scores for each day of activity
        for (const day in activity) {
            // Check if a raw score already exists for this day
            const existingRawScore = await getRawScoreForUser(
                this.supabase,
                user.user_id,
                projectId,
                this.signalStrengthId,
                day,
            )

            if (existingRawScore) {
                this.logger.info(
                    `[ScoreManager] Raw score for user ${user.user_id} on day ${day} already exists. Skipping.`,
                )
                continue
            }

            const dailyContent = JSON.stringify(activity[day])
            const rawScore = await this.aiOrchestrator.generateRawScores(
                user,
                day,
                dailyContent,
                "", // No logs for now
                signalConfig,
                projectId,
            )
            if (rawScore) {
                await saveScore(this.supabase, rawScore)
                this.logger.info(`[ScoreManager] Saved raw score for user ${user.user_id} on day ${day}.`)
            }
        }

        // 4. Fetch all recent raw scores for the user
        const recentRawScores = await getRawScoresForUser(
            this.supabase,
            user.user_id,
            projectId,
            signalConfig.signalStrengthId,
        )

        if (recentRawScores.length === 0) {
            this.logger.warn(
                `[ScoreManager] No raw scores found for user ${user.user_id}. Cannot generate smart score.`,
            )
            return
        }

        // 5. Generate and save the smart score
        const smartScore = await this.aiOrchestrator.generateSmartScoreSummary(
            user,
            recentRawScores,
            signalConfig,
            projectId,
        )

        if (smartScore) {
            await saveScore(this.supabase, smartScore)
            this.logger.info(`[ScoreManager] Saved smart score for user ${user.user_id}.`)

            // Delete duplicate scores to handle race conditions
            if (smartScore.day && smartScore.request_id) {
                const deletedCount = await deleteDuplicateScores(this.supabase, {
                    userId: user.user_id.toString(),
                    projectId: projectId,
                    signalStrengthId: this.signalStrengthId,
                    day: smartScore.day,
                    keepRequestId: smartScore.request_id,
                    isRawScore: false,
                })

                if (deletedCount > 0) {
                    this.logger.info(
                        `[ScoreManager] Deleted ${deletedCount} duplicate smart scores for user ${user.user_id}.`,
                    )
                }
            } else {
                this.logger.warn(
                    `[ScoreManager] Could not delete duplicate scores for user ${user.user_id} due to missing day or request_id.`,
                )
            }
        }

        this.logger.info(`[ScoreManager] Finished score generation for user ${user.user_id}.`)
    }
}
