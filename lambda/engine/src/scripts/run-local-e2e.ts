import * as dotenv from "dotenv"
import * as path from "path"
import * as winston from "winston"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import nock from "nock"
import { AIOrchestrator } from "../aiOrchestrator"
import { DiscourseAdapter } from "@discourse/adapter"
import { getLegacySignalConfig } from "../dbClient"
import { AppConfig, DiscourseAdapterRuntimeConfig } from "../config"
import { ForumUser, User } from "../types"

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../../.env") })

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf((info) => {
            const { timestamp, level, message, ...meta } = info
            let log = `[${timestamp}] ${level}: ${message}`
            if (Object.keys(meta).length) {
                log += ` ${JSON.stringify(meta, null, 2)}`
            }
            return log
        }),
    ),
    transports: [new winston.transports.Console()],
})

// --- Test Configuration ---
const PROJECT_ID = 1 // High Signal project
const SIGNAL_STRENGTH_ID = 1 // 'raw' signal strength
const MOCK_API_URL = "https://community.highsignal.io"
const TEST_USER_ID = 99999

// A dummy user to satisfy the foreign key constraint in forum_users.
const TEST_PARENT_USER: Pick<
    User,
    "id" | "created_at" | "display_name" | "username" | "signup_code" | "profile_image_url"
> = {
    id: TEST_USER_ID,
    created_at: new Date(0).toISOString(),
    display_name: "E2E Test User",
    username: "e2e-test-user",
    signup_code: "E2E-TEST-CODE",
    profile_image_url: "", // Added to satisfy not-null constraint
}

const TEST_FORUM_USER: ForumUser = {
    user_id: TEST_USER_ID,
    project_id: PROJECT_ID,
    forum_username: "test-e2e-user",
    created_at: new Date(0).toISOString(),
    last_updated: new Date(0).toISOString(),
    auth_encrypted_payload: null,
    auth_post_code: null,
    auth_post_code_created: null,
    auth_post_id: null,
}

const setup = async function setup(supabase: SupabaseClient, lastUpdated?: string, previousDays?: number) {
    logger.info(`Cleaning up any previous test scores for user ID ${TEST_USER_ID}...`)
    // IMPORTANT: Only delete test-generated scores. Do NOT touch user or config tables.
    await supabase.from("user_signal_strengths").delete().eq("user_id", TEST_USER_ID)

    // IMPORTANT: Use upsert for all seeding to be non-destructive.
    logger.info(`Upserting test user ${TEST_PARENT_USER.username}...`)
    const { error: userUpsertError } = await supabase.from("users").upsert(TEST_PARENT_USER)
    if (userUpsertError) {
        logger.error("Error upserting user:", userUpsertError)
        throw new Error("Failed to upsert test user.")
    }

    const forumUserToUpsert = { ...TEST_FORUM_USER }
    if (lastUpdated) {
        forumUserToUpsert.last_updated = lastUpdated
    }
    const { error: forumUserUpsertError } = await supabase.from("forum_users").upsert(forumUserToUpsert)
    if (forumUserUpsertError) {
        logger.error("Error upserting forum user:", forumUserUpsertError)
        throw new Error("Failed to upsert test forum user.")
    }

    logger.info(`Upserting project_signal_strengths with previous_days = ${previousDays ?? "default"}`)
    const { error: configError } = await supabase.from("project_signal_strengths").upsert({
        project_id: PROJECT_ID,
        signal_strength_id: SIGNAL_STRENGTH_ID,
        previous_days: previousDays === undefined ? 0 : previousDays,
        enabled: true,
        max_value: 100,
    })
    if (configError) {
        logger.error("Error upserting project_signal_strengths:", configError)
        throw new Error("Failed to upsert project_signal_strengths config.")
    }

    logger.info("Test user and config seeded successfully.")
}

const mockDiscourseAPI = (latestActivityDate: Date) => {
    const twoDaysAgo = new Date(latestActivityDate)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 1)

    nock.cleanAll() // Clean up previous mocks
    nock(MOCK_API_URL)
        .get(`/users/${TEST_FORUM_USER.forum_username}/activity.json`)
        .reply(200, {
            user_actions: [
                { action_type: 4, created_at: latestActivityDate.toISOString() }, // New Topic
                { action_type: 5, created_at: latestActivityDate.toISOString() }, // Reply
                { action_type: 1, created_at: latestActivityDate.toISOString() }, // Like
                { action_type: 5, created_at: twoDaysAgo.toISOString() }, // Reply
            ],
        })
    logger.info("Discourse API endpoint mocked.")
}

const initializeAdapter = async (supabaseUrl: string, supabaseServiceKey: string) => {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const appConfig: AppConfig = {
        NODE_ENV: "development",
        LOG_LEVEL: "info",
        SUPABASE_URL: supabaseUrl,
        ENABLE_USER_CENTRIC_WORKFLOW: true,
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || "test-key",
    }

    const aiOrchestrator = new AIOrchestrator(appConfig, logger)

    const aiConfig = await getLegacySignalConfig(SIGNAL_STRENGTH_ID, PROJECT_ID)
    if (!aiConfig) {
        throw new Error("Could not fetch AI config from DB for test setup.")
    }

    const runtimeConfig: DiscourseAdapterRuntimeConfig = {
        API_URL: MOCK_API_URL,
        API_KEY: process.env.DISCOURSE_API_KEY || "test-key",
        PROJECT_ID: PROJECT_ID,
        SIGNAL_STRENGTH_ID: SIGNAL_STRENGTH_ID,
        MAX_VALUE: 100,
        aiConfig: aiConfig,
    }

    const discourseAdapter = new DiscourseAdapter(logger, aiOrchestrator, runtimeConfig)

    return { discourseAdapter, supabase, aiConfig }
}

const runTestSuite = async () => {
    logger.info("Starting local end-to-end test...")

    // 1. Initialize Supabase Client and Adapter
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        logger.error("Missing Supabase environment variables.")
        process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Initial seed for adapter initialization
    logger.info("--- Initializing Test Environment ---")
    await setup(supabase)
    logger.info("--- Test Environment Initialized ---")

    const { discourseAdapter, aiConfig } = await initializeAdapter(supabaseUrl, supabaseServiceKey)

    // --- Test Case 1: New user should be processed fully ---
    logger.info("--- Running Test Case 1: New User Processing ---")
    await setup(supabase) // Re-seed for test isolation
    const latestActivityDate1 = new Date()
    latestActivityDate1.setDate(latestActivityDate1.getDate() - 1)
    mockDiscourseAPI(latestActivityDate1)

    await discourseAdapter.processUser(String(TEST_USER_ID), PROJECT_ID, aiConfig)

    const { data: rawScores, error: rawScoresError } = await supabase
        .from("user_signal_strengths")
        .select("id")
        .eq("user_id", TEST_USER_ID)
        .eq("signal_strength_id", SIGNAL_STRENGTH_ID) // Explicitly check for raw scores
    if (rawScoresError) throw rawScoresError
    if (rawScores.length !== 2) {
        throw new Error(`[Test Case 1] Expected 2 raw scores, but found ${rawScores.length}.`)
    }
    logger.info(`[Test Case 1] ✅ Verified: 2 raw scores created.`)

    const { data: smartScores, error: smartScoreError } = await supabase
        .from("user_signal_strengths")
        .select("value")
        .eq("user_id", TEST_USER_ID)
        .is("raw_value", null)
    if (smartScoreError || !smartScores || smartScores.length !== 1) {
        throw new Error(`[Test Case 1] Expected 1 smart score, but found ${smartScores?.length}.`)
    }
    logger.info(`[Test Case 1] ✅ Verified: 1 smart score created.`)

    // Verify last_updated timestamp was updated
    const { data: updatedForumUser, error: userError } = await supabase
        .from("forum_users")
        .select("last_updated")
        .eq("user_id", TEST_USER_ID)
        .single()
    if (userError) throw userError
    const initialDate = new Date(0)
    const lastUpdatedDate = new Date(updatedForumUser.last_updated)
    if (lastUpdatedDate <= initialDate) {
        throw new Error(
            `[Test Case 1] Expected last_updated to be newer than ${initialDate.toISOString()}, but got ${lastUpdatedDate.toISOString()}.`,
        )
    }
    logger.info(`[Test Case 1] ✅ Verified: last_updated timestamp was updated to ${lastUpdatedDate.toISOString()}.`)
    logger.info("--- Test Case 1 Passed ---")

    // --- Test Case 2: User with no new activity should be skipped ---
    logger.info("--- Running Test Case 2: Up-to-Date User Skipping ---")
    const lastUpdated = new Date() // Now
    const latestActivityDate2 = new Date()
    latestActivityDate2.setDate(latestActivityDate2.getDate() - 1) // Yesterday
    await setup(supabase, lastUpdated.toISOString())
    mockDiscourseAPI(latestActivityDate2)

    await discourseAdapter.processUser(String(TEST_USER_ID), PROJECT_ID, aiConfig)

    const { data: scores2, error: scoresError2 } = await supabase
        .from("user_signal_strengths")
        .select("id")
        .eq("user_id", TEST_USER_ID)
    if (scoresError2) throw scoresError2
    if (scores2.length !== 0) {
        throw new Error(`[Test Case 2] Expected 0 scores, but found ${scores2.length}. User should have been skipped.`)
    }
    logger.info("[Test Case 2] ✅ Verified: No new scores created.")
    logger.info("--- Test Case 2 Passed ---")

    // --- Test Case 3: Smart score idempotency ---
    logger.info("--- Running Test Case 3: Smart Score Idempotency ---")
    await setup(supabase)
    const latestActivityDate3 = new Date()
    latestActivityDate3.setDate(latestActivityDate3.getDate() - 1)
    mockDiscourseAPI(latestActivityDate3)

    // First run: should generate a smart score
    logger.info("[Test Case 3] First run...")
    await discourseAdapter.processUser(String(TEST_USER_ID), PROJECT_ID, aiConfig)
    const { data: smartScores3_first, error: smartScoresError3_first } = await supabase
        .from("user_signal_strengths")
        .select("id")
        .eq("user_id", TEST_USER_ID)
        .is("raw_value", null)
    if (smartScoresError3_first) throw smartScoresError3_first
    if (smartScores3_first.length !== 1) {
        throw new Error(`[Test Case 3] Expected 1 smart score on first run, but found ${smartScores3_first.length}.`)
    }
    logger.info("[Test Case 3] ✅ Verified: Smart score created on first run.")

    // Second run: should skip generating a smart score
    logger.info("[Test Case 3] Second run...")
    mockDiscourseAPI(latestActivityDate3) // Re-mock the API for the second call
    await discourseAdapter.processUser(String(TEST_USER_ID), PROJECT_ID, aiConfig)
    const { data: smartScores3_second, error: smartScoresError3_second } = await supabase
        .from("user_signal_strengths")
        .select("id")
        .eq("user_id", TEST_USER_ID)
        .is("raw_value", null)
    if (smartScoresError3_second) throw smartScoresError3_second
    if (smartScores3_second.length !== 1) {
        throw new Error(
            `[Test Case 3] Expected 1 smart score after second run, but found ${smartScores3_second.length}.`,
        )
    }
    logger.info("[Test Case 3] ✅ Verified: Smart score was not regenerated.")
    logger.info("--- Test Case 3 Passed ---")

    // --- Test Case 4: Atomic Score Upsert ---
    logger.info("--- Running Test Case 4: Atomic Score Upsert ---")
    await setup(supabase)
    const latestActivityDate4 = new Date()
    mockDiscourseAPI(latestActivityDate4)

    // First run should create scores
    await discourseAdapter.processUser(String(TEST_USER_ID), PROJECT_ID, aiConfig)
    const { data: scores4_first, error: scoresError4_first } = await supabase
        .from("user_signal_strengths")
        .select("id")
        .eq("user_id", TEST_USER_ID)
    if (scoresError4_first) throw scoresError4_first
    if (scores4_first.length === 0) {
        throw new Error(`[Test Case 4] Expected scores to be created on first run, but found none.`)
    }
    logger.info(`[Test Case 4] ✅ Verified: ${scores4_first.length} scores created on first run.`)

    // Second run with same data should not create new scores
    mockDiscourseAPI(latestActivityDate4) // Re-mock
    await discourseAdapter.processUser(String(TEST_USER_ID), PROJECT_ID, aiConfig)
    const { data: scores4_second, error: scoresError4_second } = await supabase
        .from("user_signal_strengths")
        .select("id")
        .eq("user_id", TEST_USER_ID)
    if (scoresError4_second) throw scoresError4_second
    if (scores4_second.length !== scores4_first.length) {
        throw new Error(
            `[Test Case 4] Expected upsert to be idempotent. Found ${scores4_first.length} scores on first run and ${scores4_second.length} on second run.`,
        )
    }
    logger.info("[Test Case 4] ✅ Verified: upsert is idempotent and did not create duplicate scores.")
    logger.info("--- Test Case 4 Passed ---")

    // --- Test Case 5: Dynamic Day Lookback ---
    logger.info("--- Running Test Case 5: Dynamic Day Lookback ---")
    const lookbackDays = 2
    await setup(supabase, undefined, lookbackDays) // Set lookback to 2 days

    const activityDateWithinLookback = new Date()
    activityDateWithinLookback.setDate(activityDateWithinLookback.getDate() - 1) // 1 day ago
    mockDiscourseAPI(activityDateWithinLookback)

    await discourseAdapter.processUser(String(TEST_USER_ID), PROJECT_ID, aiConfig)

    const { data: scores5, error: scoresError5 } = await supabase
        .from("user_signal_strengths")
        .select("id")
        .eq("user_id", TEST_USER_ID)
        .eq("signal_strength_id", SIGNAL_STRENGTH_ID) // only raw scores
    if (scoresError5) throw scoresError5
    // The mock returns activity on one day, so we expect 1 raw score record.
    if (scores5.length !== 1) {
        throw new Error(`[Test Case 5] Expected 1 raw score, but found ${scores5.length}.`)
    }
    logger.info("[Test Case 5] ✅ Verified: Correct number of scores created within the dynamic lookback period.")
    logger.info("--- Test Case 5 Passed ---")

    logger.info("--- ✅ ALL E2E VERIFICATIONS PASSED ---")
}

const main = async () => {
    try {
        await runTestSuite()
    } catch (error) {
        logger.error("❌ E2E TEST SUITE FAILED", {
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
        })
        process.exit(1)
    } finally {
        nock.cleanAll()
        logger.info("Test suite finished.")
    }
}

main()
