/**
 * @file This module serves as the shared data access layer for the Lambda monorepo.
 * It encapsulates all interactions with the Supabase database, providing a suite
 * of functions for fetching and persisting data related to users, configurations, and AI scores.
 * It uses a singleton pattern to manage the Supabase client instance.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js"
import type { ForumUser, UserSignalStrength, AiConfig, Prompt } from "./types"

let supabaseClient: SupabaseClient | null = null

/**
 * Initializes and returns a singleton Supabase client instance.
 * This function ensures that the Supabase client is created only once per Lambda invocation.
 * @param url The Supabase project URL.
 * @param key The Supabase service role key.
 * @returns An initialized Supabase client.
 */
export const getSupabaseClient = (url: string, key: string): SupabaseClient => {
    if (supabaseClient) {
        return supabaseClient
    }

    if (!url || !key) {
        // This check is critical. In a serverless environment, misconfigured credentials
        // can be hard to debug. Failing fast is the best approach.
        throw new Error("Supabase URL or service role key is not configured.")
    }

    supabaseClient = createClient(url, key, {
        auth: {
            // We are using the service role key, which provides admin-level access.
            // Session persistence is not required and should be disabled.
            persistSession: false,
        },
    })

    return supabaseClient
}

/**
 * Fetches the most recent score date for a single user.
 * This is used to determine if a user's activity has been processed since the last score was generated.
 * @param supabase An initialized Supabase client.
 * @param userId The ID of the user.
 * @param projectId The ID of the project.
 * @returns A promise that resolves to the most recent score date ('YYYY-MM-DD'), or null if no scores are found.
 */
export async function getUserLastUpdate(
    supabase: SupabaseClient,
    userId: number,
    projectId: string,
): Promise<string | null> {
    const { data, error } = await supabase
        .from("user_signal_strengths")
        .select("day")
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .order("day", { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) {
        console.error(
            `[DBShared] Unexpected error fetching last score date for user ${userId} in project ${projectId}:`,
            { details: error },
        )
        throw new Error(`Failed to fetch user's last score date: ${error.message}`)
    }

    return data?.day || null
}

/**
 * Fetches user details for a given list of user IDs.
 * @param supabase An initialized Supabase client.
 * @param userIds An array of user IDs.
 * @returns A promise that resolves to a Map where keys are user IDs and values are user details.
 */
export async function getUsersByIds(
    supabase: SupabaseClient,
    userIds: number[],
): Promise<Map<number, { username: string; displayName: string }>> {
    const { data, error } = await supabase.from("users").select("id, username, display_name").in("id", userIds)

    if (error) {
        throw new Error(`Failed to fetch users by IDs: ${error.message}`)
    }

    const userMap = new Map<number, { username: string; displayName: string }>()
    if (data) {
        for (const user of data) {
            userMap.set(user.id, {
                username: user.username,
                displayName: user.display_name,
            })
        }
    }
    return userMap
}

/**
 * Fetches the complete, consolidated AI and signal configuration for a given signal strength and project.
 * This function mirrors the legacy system's approach by fetching all necessary parameters
 * (model, temp, prompts, max_chars, max_value, and previous_days) in a single, efficient query.
 * @param supabase An initialized Supabase client.
 * @param signalStrengthId The ID of the signal strength configuration to fetch.
 * @param projectId The ID of the project.
 * @returns A promise that resolves to a structured `AiConfig` object, or null if not found or disabled.
 */
export async function getLegacySignalConfig(
    supabase: SupabaseClient,
    signalStrengthId: string,
    projectId: string,
): Promise<AiConfig | null> {
    const { data, error } = await supabase
        .from("signal_strengths")
        .select(
            `
            id,
            name,
            display_name,
            status,
            model,
            temperature,
            max_chars,
            prompts(id, prompt, type, created_at, signal_strength_id),
            project_signal_strengths!inner(
              enabled,
              max_value,
              previous_days
            )
          `,
        )
        .eq("id", signalStrengthId)
        .eq("project_signal_strengths.project_id", projectId)
        .single()

    if (error) {
        // An inner join will correctly error if no matching project config is found.
        // This is an expected case if the signal is not configured for the project.
        console.info(
            `[DBShared] Could not fetch legacy config for signal ${signalStrengthId} and project ${projectId}. It might be disabled or not configured. Message: ${error.message}`,
        )
        return null
    }

    if (!data) {
        console.info(
            `[DBShared] No data returned for legacy config for signal ${signalStrengthId} and project ${projectId}.`,
        )
        return null
    }

    // The inner join ensures project_signal_strengths has at least one item.
    const projectConfig = data.project_signal_strengths[0]
    if (!projectConfig || !projectConfig.enabled) {
        console.info(`[DBShared] Signal ${signalStrengthId} is disabled for project ${projectId}.`)
        return null
    }

    const prompts: Prompt[] = Array.isArray(data.prompts) ? data.prompts : data.prompts ? [data.prompts] : []

    return {
        signalStrengthId: data.id,
        model: data.model,
        temperature: data.temperature,
        maxChars: data.max_chars,
        maxValue: projectConfig.max_value ?? 100, // Default to 100 if null, as per legacy behavior
        previous_days: projectConfig.previous_days ?? null,
        prompts,
    }
}

/**
 * Fetches all forum users associated with a specific project, optionally filtered by user IDs.
 * @param supabase An initialized Supabase client.
 * @param projectId The ID of the project.
 * @param userIds An optional array of user IDs to filter the results.
 * @returns A promise that resolves to an array of `ForumUser` objects.
 */
export async function getForumUsersForProject(
    supabase: SupabaseClient,
    projectId: string,
    userIds?: number[],
): Promise<ForumUser[]> {
    let query = supabase.from("forum_users").select("*").eq("project_id", projectId)

    if (userIds && userIds.length > 0) {
        query = query.in("user_id", userIds)
    }

    const { data, error } = await query

    if (error) {
        throw new Error(`Failed to fetch forum users: ${error.message}`)
    }

    return data || []
}

/**
 * Checks if a raw score already exists for a specific user, project, and day.
 * @param supabase An initialized Supabase client.
 * @param userId The user's ID.
 * @param projectId The project's ID.
 * @param signalStrengthId The signal strength ID.
 * @param date The date string in 'YYYY-MM-DD' format.
 * @returns A promise that resolves to the existing raw score data, or null if not found.
 */
export async function getRawScoreForUser(
    supabase: SupabaseClient,
    userId: number,
    projectId: string,
    signalStrengthId: string,
    date: string,
): Promise<UserSignalStrength | null> {
    const { data, error } = await supabase
        .from("user_signal_strengths")
        .select("*")
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .eq("signal_strength_id", signalStrengthId)
        .eq("day", date)
        .not("raw_value", "is", null)
        .maybeSingle()

    if (error) {
        throw new Error(`Failed to fetch raw score: ${error.message}`)
    }

    return data
}

/**
 * Fetches an existing "smart" score for a user on a specific day.
 * @param supabase An initialized Supabase client.
 * @param userId The user's ID.
 * @param projectId The project's ID.
 * @param signalStrengthId The signal strength ID.
 * @param day The specific day ('YYYY-MM-DD') to check for a score.
 * @returns A promise that resolves to the existing score object, or null if not found.
 */
export async function getSmartScoreForUser(
    supabase: SupabaseClient,
    userId: number,
    projectId: string,
    signalStrengthId: string,
    day: string,
): Promise<any | null> {
    const { data, error } = await supabase
        .from("user_signal_strengths")
        .select("*")
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .eq("signal_strength_id", signalStrengthId)
        .eq("day", day)
        .is("raw_value", null)
        .not("value", "is", null)
        .maybeSingle()

    if (error) {
        throw new Error(`Failed to fetch smart score: ${error.message}`)
    }

    return data
}

/**
 * Saves a score to the database by first deleting any existing score for the same
 * user, project, signal, and day, and then inserting the new score.
 * @param supabase An initialized Supabase client.
 * @param scoreData The complete score object to be inserted.
 * @returns A promise that resolves when the operation is complete.
 */
export async function saveScore(
    supabase: SupabaseClient,
    scoreData: Omit<UserSignalStrength, "id" | "created_at" | "test_requesting_user">,
): Promise<void> {
    const { error } = await supabase.from("user_signal_strengths").insert(scoreData)

    if (error) {
        throw new Error(`Failed to save score: ${error.message}`)
    }
}

/**
 * Deletes all smart scores for a given user, project, and signal strength.
 * Smart scores are identified by having a `null` raw_value.
 */
export async function deleteSmartScoresForUser(
    supabase: SupabaseClient,
    userId: number,
    projectId: string,
    signalStrengthId: string,
): Promise<void> {
    const { error } = await supabase
        .from("user_signal_strengths")
        .delete()
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .eq("signal_strength_id", signalStrengthId)
        .is("raw_value", null)

    if (error) {
        throw new Error(`Failed to delete smart scores for user ${userId}: ${error.message}`)
    }
}

/**
 * Deletes a raw score for a specific user, project, signal, and day.
 */
export async function deleteRawScore(
    supabase: SupabaseClient,
    userId: number,
    projectId: string,
    signalStrengthId: string,
    day: string,
): Promise<void> {
    const { error } = await supabase
        .from("user_signal_strengths")
        .delete()
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .eq("signal_strength_id", signalStrengthId)
        .eq("day", day)
        .not("raw_value", "is", null)

    if (error) {
        throw new Error(`Failed to delete raw score for user ${userId} on day ${day}: ${error.message}`)
    }
}

/**
 * Fetches recent raw scores for a given user.
 * The lookback period (number of days) is dynamically fetched from the project's
 * signal strength configuration. If not specified, it defaults to 30 days.
 * @param supabase An initialized Supabase client.
 * @param userId The user's ID.
 * @param projectId The project's ID.
 * @param signalStrengthId The signal strength ID.
 * @returns A promise that resolves to an array of recent raw scores.
 */
export async function getRawScoresForUser(
    supabase: SupabaseClient,
    userId: number,
    projectId: string,
    signalStrengthId: string,
): Promise<Pick<UserSignalStrength, "day" | "raw_value" | "max_value">[]> {
    const DEFAULT_LOOKBACK_DAYS = 30

    const signalConfig = await getLegacySignalConfig(supabase, signalStrengthId, projectId)
    const lookbackDays = signalConfig?.previous_days ?? DEFAULT_LOOKBACK_DAYS

    const lookbackDate = new Date()
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays)

    const { data, error } = await supabase
        .from("user_signal_strengths")
        .select("day, raw_value, max_value")
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .eq("signal_strength_id", signalStrengthId)
        .gte("day", lookbackDate.toISOString().split("T")[0])
        .not("raw_value", "is", null)
        .order("day", { ascending: false })

    if (error) {
        throw error
    }

    return data || []
}

/**
 * Resets the singleton Supabase client instance.
 * **FOR TESTING PURPOSES ONLY.**
 * This function clears the cached client, allowing tests to re-initialize it with
 * different configurations or mocks.
 * @throws An error if called outside of a `test` environment.
 */
export function _resetSupabaseClient_TEST_ONLY(): void {
    if (process.env.NODE_ENV === "test") {
        supabaseClient = null
    } else {
        console.warn(
            "[DBShared] _resetSupabaseClient_TEST_ONLY was called outside of a test environment. This is not allowed.",
        )
    }
}
