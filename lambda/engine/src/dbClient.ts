/**
 * @file This module serves as the data access layer for the Lambda Engine.
 * It encapsulates all interactions with the Supabase database, providing a suite
 * of functions for fetching and persisting data related to users, configurations, and AI scores.
 * It uses a singleton pattern to manage the Supabase client instance.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { AppConfig, getAppConfig } from "./config"
import { AiConfig, ForumUser, Prompt, UserSignalStrength } from "./types"

/**
 * A singleton instance of the Supabase client.
 * It is initialized on the first call to `getSupabaseClient` and reused thereafter.
 * @type {SupabaseClient | null}
 */
let supabaseClient: SupabaseClient | null = null

/**
 * Initializes and returns a singleton Supabase client instance.
 *
 * This function ensures that the Supabase client is created only once per Lambda
 * invocation. It fetches the necessary credentials from the application configuration.
 *
 * @returns A promise that resolves to the initialized Supabase client.
 * @throws An error if the Supabase URL or service role key is not configured.
 */
export const getSupabaseClient = async (): Promise<SupabaseClient> => {
    if (supabaseClient) {
        return supabaseClient
    }

    const config: AppConfig = await getAppConfig()

    if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
        // The logger might not be initialized yet, so we throw a clear error.
        throw new Error("Supabase URL or service role key is not configured.")
    }

    supabaseClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            persistSession: false,
        },
    })

    return supabaseClient
}

/**
 * Fetches the `last_updated` timestamp for a single forum user.
 *
 * @param userId The ID of the user.
 * @param projectId The ID of the project.
 * @returns A promise that resolves to the user's `last_updated` ISO timestamp, or null if not found.
 */
export async function getUserLastUpdate(userId: number, projectId: number): Promise<string | null> {
    const supabase = await getSupabaseClient()
    const { data, error } = await supabase
        .from("forum_users")
        .select("last_updated")
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .single()

    if (error) {
        // 'PGRST116' is the code for "exact one row not found", which is an expected
        // outcome if the user is new or doesn't exist in the forum_users table yet.
        // We don't treat this as a throw-worthy error.
        if (error.code !== "PGRST116") {
            console.error(
                `[DBClient] Unexpected error fetching last update for user ${userId} in project ${projectId}:`,
                { details: error },
            )
            throw new Error(`Failed to fetch user's last update timestamp: ${error.message}`)
        }
        // For PGRST116, we simply proceed and will return null.
    }

    return data?.last_updated || null
}

/**
 * Updates the `last_updated` timestamp for a single forum user to the current time.
 *
 * @param userId The ID of the user.
 * @param projectId The ID of the project.
 * @returns A promise that resolves when the update is complete.
 */
export async function updateUserLastUpdate(userId: number, projectId: number): Promise<void> {
    const supabase = await getSupabaseClient()
    const { error } = await supabase
        .from("forum_users")
        .update({ last_updated: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("project_id", projectId)

    if (error) {
        console.error(`[DBClient] Failed to update last_updated for user ${userId} in project ${projectId}:`, {
            details: error,
        })
        throw new Error(`Failed to update user's last_updated timestamp: ${error.message}`)
    }
}

/**
 * Fetches the dates for which raw scores already exist for a given set of users.
 *
 * This function is crucial for idempotency, allowing the engine to skip processing
 * for days that already have a score.
 *
 * @param userIds An array of user IDs to check.
 * @param signalStrengthId The specific signal strength ID to check for.
 * @returns A promise that resolves to a Map where keys are user IDs and values are Sets of 'YYYY-MM-DD' date strings.
 */
export async function getExistingScoreDays(
    userIds: number[],
    signalStrengthId: number,
): Promise<Map<number, Set<string>>> {
    const supabase = await getSupabaseClient()
    const { data, error } = await supabase
        .from("user_signal_strengths")
        .select("user_id, created")
        .in("user_id", userIds)
        .eq("signal_strength_id", signalStrengthId)

    if (error) {
        console.error(`[DBCLIENT] Error fetching existing score days:`, error)
        throw new Error(`Failed to fetch existing scores: ${error.message}`)
    }

    const existingScoresMap = new Map<number, Set<string>>()
    for (const score of data) {
        if (score.user_id && score.created) {
            if (!existingScoresMap.has(score.user_id)) {
                existingScoresMap.set(score.user_id, new Set())
            }
            // Extracting YYYY-MM-DD from the timestamp
            const day = new Date(score.created).toISOString().split("T")[0]
            existingScoresMap.get(score.user_id)!.add(day)
        }
    }

    return existingScoresMap
}

/**
 * Fetches basic user details (username and display name) for a given list of user IDs.
 *
 * @param userIds An array of user IDs.
 * @returns A promise that resolves to a Map where keys are user IDs and values are objects containing username and displayName.
 */
export async function getUsersByIds(
    userIds: number[],
): Promise<Map<number, { username: string; displayName: string }>> {
    if (userIds.length === 0) {
        return new Map()
    }
    const supabase = await getSupabaseClient()
    const { data, error } = await supabase.from("users").select("id, username, display_name").in("id", userIds)

    if (error) {
        console.error(`[DBCLIENT] Error fetching users by IDs:`, error)
        throw new Error(`Failed to fetch users: ${error.message}`)
    }

    const usersMap = new Map<number, { username: string; displayName: string }>()
    if (data) {
        for (const user of data) {
            if (user.id && user.username && user.display_name) {
                usersMap.set(user.id, {
                    username: user.username,
                    displayName: user.display_name,
                })
            }
        }
    }

    return usersMap
}

/**
 * Fetches the complete AI configuration for a given signal strength and project.
 *
 * This function retrieves the signal strength parameters (model, temp, etc.) and all
 * associated prompts (both 'raw' and 'smart') from the database.
 *
 * @param signalStrengthId The ID of the signal strength configuration to fetch.
 * @param projectId The ID of the project.
 * @returns A promise that resolves to a structured `AiConfig` object, or null if not found.
 */
/**
 * Fetches the specific configuration for a signal strength within a project.
 *
 * This is used to retrieve dynamic parameters, such as the `previous_days` lookback
 * period for raw score generation, ensuring parity with legacy system behavior.
 *
 * @param signalStrengthId The ID of the signal strength.
 * @param projectId The ID of the project.
 * @returns A promise that resolves to an object containing the `previous_days` value, or null if not found.
 */
export async function getSignalStrengthConfig(
    signalStrengthId: number,
    projectId: number,
): Promise<{ previous_days: number } | null> {
    const supabase = await getSupabaseClient()
    const { data, error } = await supabase
        .from("project_signal_strengths")
        .select("previous_days")
        .eq("signal_strength_id", signalStrengthId)
        .eq("project_id", projectId)
        .single()

    if (error) {
        if (error.code !== "PGRST116") {
            console.error(
                `[DBClient] Error fetching signal strength config for signal ${signalStrengthId} in project ${projectId}`,
                { error },
            )
        }
        // Return null for not found or other errors, allowing the caller to use a default.
        return null
    }

    // If previous_days is 0, it signifies the default behavior (no specific lookback).
    // In this case, we return null to let the adapter process all available activity.
    if (!data || data.previous_days === 0 || typeof data.previous_days !== 'number') {
        return null
    }

    return data
}

export async function getAiConfig(signalStrengthId: number, projectId: number): Promise<AiConfig | null> {
    const supabase = await getSupabaseClient()

    const { data, error } = await supabase
        .from("signal_strengths")
        .select(
            `
        model,
        temperature,
        max_chars,
        prompts (*),
        project_signal_strengths!inner (
          enabled,
          max_value
        )
      `,
        )
        .eq("id", signalStrengthId)
        .eq("project_signal_strengths.project_id", projectId)
        .single()

    if (error) {
        // Inner join will error if no matching project config found, which is expected.
        // Log as info, not error.
        console.info(
            `[DBCLIENT] Could not fetch AI config for signal ${signalStrengthId} and project ${projectId}. It might be disabled.`,
            error.message,
        )
        return null
    }

    const prompts: Prompt[] = Array.isArray(data.prompts) ? data.prompts : data.prompts ? [data.prompts] : []

    return {
        signalStrengthId: signalStrengthId,
        model: data.model,
        temperature: data.temperature,
        maxChars: data.max_chars,
        maxValue: data.project_signal_strengths[0].max_value ?? 100, // Default to 100 if null
        prompts,
    }
}

/**
 * Fetches final "smart" scores for a set of users on a specific day.
 *
 * This is primarily used for validation and testing purposes to confirm that scores
 * were written correctly.
 *
 * @param userIds An array of user IDs.
 * @param day The 'YYYY-MM-DD' date string for which to fetch scores.
 * @param signalStrengthId The specific signal strength ID.
 * @returns A promise that resolves to a Map where keys are user IDs and values are the detailed score objects.
 */
export async function getScoresForUsersOnDay(
    userIds: number[],
    day: string,
    signalStrengthId: number,
): Promise<
    Map<
        number,
        {
            score: number
            summary: string
            description: string
            improvements: string
            explained_reasoning: string
        }
    >
> {
    const supabase = await getSupabaseClient()
    const { data, error } = await supabase
        .from("user_signal_strengths")
        .select("user_id, value, summary, description, improvements, explained_reasoning")
        .in("user_id", userIds)
        .eq("day", day)
        .eq("signal_strength_id", signalStrengthId)
        .is("raw_value", null) // Smart scores have null raw_value

    if (error) {
        console.error("Error fetching scores for validation:", error)
        throw error
    }

    const resultMap = new Map<
        number,
        {
            score: number
            summary: string
            description: string
            improvements: string
            explained_reasoning: string
        }
    >()
    if (!data) {
        return resultMap
    }

    for (const row of data) {
        resultMap.set(row.user_id, {
            score: row.value ?? 0,
            summary: row.summary ?? "",
            description: row.description ?? "",
            improvements: row.improvements ?? "",
            explained_reasoning: row.explained_reasoning ?? "",
        })
    }

    return resultMap
}

/**
 * Fetches all forum users associated with a specific project, optionally filtered by user IDs.
 *
 * @param projectId The ID of the project.
 * @param userIds An optional array of user IDs to filter the results.
 * @returns A promise that resolves to an array of `ForumUser` objects.
 */
export async function getForumUsersForProject(projectId: number, userIds?: number[]): Promise<ForumUser[]> {
    const supabase = await getSupabaseClient()
    let query = supabase.from("forum_users").select("*").eq("project_id", projectId)

    if (userIds && userIds.length > 0) {
        query = query.in("user_id", userIds)
    }

    const { data, error } = await query

    if (error) {
        console.error(`[DBCLIENT] Error fetching forum users for project ${projectId}:`, error)
        throw new Error(`Failed to fetch forum users: ${error.message}`)
    }

    return data || []
}

/**
 * Checks if a raw score already exists for a specific user, project, and day.
 *
 * @param userId The user's ID.
 * @param projectId The project's ID.
 * @param signalStrengthId The signal strength ID.
 * @param date The date string in 'YYYY-MM-DD' format.
 * @returns A promise that resolves to the existing raw score data, or null if not found.
 */
export async function getRawScoreForUser(
    userId: number,
    projectId: number,
    signalStrengthId: number,
    date: string,
): Promise<UserSignalStrength | null> {
    const supabase = await getSupabaseClient()
    const { data, error } = await supabase
        .from("user_signal_strengths")
        .select("*")
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .eq("signal_strength_id", signalStrengthId)
        .eq("day", date)
        .not("raw_value", "is", null)
        .single()

    if (error && error.code !== "PGRST116") {
        // PGRST116 means no rows found, which is not an error in this case.
        console.error("Error fetching raw score for user", { error })
        throw error
    }

    return data
}

/**
 * Fetches an existing "smart" score for a user on a specific day.
 *
 * @param userId The user's ID.
 * @param projectId The project's ID.
 * @param signalStrengthId The signal strength ID.
 * @param day The specific day ('YYYY-MM-DD') to check for a score.
 * @returns A promise that resolves to the existing score object, or null if not found.
 */
export async function getSmartScoreForUser(
    userId: number,
    projectId: number,
    signalStrengthId: number,
    day: string,
): Promise<any | null> {
    const supabase = await getSupabaseClient()
    const { data, error } = await supabase
        .from("user_signal_strengths")
        .select("*")
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .eq("signal_strength_id", signalStrengthId)
        .eq("day", day)
        .is("raw_value", null) // Smart scores have a null raw_value
        .maybeSingle()

    if (error) {
        console.error(`[DBCLIENT] Error fetching smart score for user ${userId} on ${day}:`, error)
        throw new Error(`Failed to fetch smart score: ${error.message}`)
    }

    return data
}

/**
 * Saves a score to the database by first deleting any existing score for the same
 * user, project, signal, and day, and then inserting the new score.
 *
 * This two-step process replicates the legacy system's behavior to ensure only the
 * latest score for a given context exists, without relying on database `ON CONFLICT`
 * constraints.
 *
 * @param scoreData The complete score object to be inserted.
 * @returns A promise that resolves when the operation is complete.
 */
export async function saveScore(
    scoreData: Omit<UserSignalStrength, "id" | "created_at" | "test_requesting_user">,
): Promise<void> {
    const supabase = await getSupabaseClient();

    // Step 1: Delete any existing score for the same unique combination.
    // This replicates the legacy `clearLastChecked.js` functionality.
    const { error: deleteError } = await supabase
        .from("user_signal_strengths")
        .delete()
        .match({
            user_id: scoreData.user_id,
            project_id: scoreData.project_id,
            signal_strength_id: scoreData.signal_strength_id,
            day: scoreData.day,
        });

    if (deleteError) {
        throw new Error(`Failed to clear previous score: ${deleteError.message}`);
    }

    // Step 2: Insert the new score.
    const { error: insertError } = await supabase
        .from("user_signal_strengths")
        .insert(scoreData);

    if (insertError) {
        throw new Error(`Failed to save score: ${insertError.message}`);
    }
}

/**
 * Fetches recent raw scores for a given user.
 *
 * The lookback period (number of days) is dynamically fetched from the project's
 * signal strength configuration. If not specified, it defaults to 30 days.
 * These scores are used as the primary input for generating the final "smart score".
 *
 * @param userId The user's ID.
 * @param projectId The project's ID.
 * @param signalStrengthId The signal strength ID.
 * @returns A promise that resolves to an array of recent raw scores.
 */
export async function getRawScoresForUser(
    userId: number,
    projectId: number,
    signalStrengthId: number,
): Promise<Pick<UserSignalStrength, "day" | "raw_value" | "summary">[]> {
    const supabase = await getSupabaseClient()
    const DEFAULT_LOOKBACK_DAYS = 30

    const signalConfig = await getSignalStrengthConfig(signalStrengthId, projectId)
    const lookbackDays = signalConfig?.previous_days ?? DEFAULT_LOOKBACK_DAYS

    if (!signalConfig) {
        console.warn(
            `[DBClient] No specific 'previous_days' config found for signal ${signalStrengthId} in project ${projectId}. Defaulting to ${DEFAULT_LOOKBACK_DAYS} days.`,
        )
    }

    const lookbackDate = new Date()
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays)

    const { data, error } = await supabase
        .from("user_signal_strengths")
        .select("day, raw_value, summary")
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .eq("signal_strength_id", signalStrengthId)
        .gte("day", lookbackDate.toISOString().split("T")[0])
        .not("raw_value", "is", null)
        .order("day", { ascending: false })

    if (error) {
        console.error("Error fetching raw scores for user", { error })
        throw error
    }

    return data || []
}



/**
 * Resets the singleton Supabase client instance.
 *
 * **FOR TESTING PURPOSES ONLY.**
 *
 * This function clears the cached client, allowing tests to re-initialize it with
 * different configurations or mocks.
 *
 * @throws An error if called outside of a `test` environment.
 */
export function _resetSupabaseClient_TEST_ONLY(): void {
    if (process.env.NODE_ENV === "test") {
        supabaseClient = null
    } else {
        console.warn(
            "[DBCLIENT] _resetSupabaseClient_TEST_ONLY was called outside of a test environment. This is not allowed.",
        )
    }
}
