/**
 * @file This module serves as the data access layer for the Lambda Engine.
 * It encapsulates all interactions with the Supabase database, providing a suite
 * of functions for fetching and persisting data related to users, configurations, and AI scores.
 * It uses a singleton pattern to manage the Supabase client instance.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { AppConfig, getAppConfig } from "./config"
import { ForumUser, Prompt, UserSignalStrength } from "./types"
import { AiConfig } from "@shared/types"

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
    // Step 1: Return the cached client if it already exists.
    if (supabaseClient) {
        return supabaseClient
    }

    // Step 2: If no client exists, fetch the application configuration.
    const config: AppConfig = await getAppConfig()

    // Step 3: Validate that the required credentials are present.
    if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
        // The logger might not be initialized yet, so we throw a clear error.
        throw new Error("Supabase URL or service role key is not configured.")
    }

    // Step 4: Create, cache, and return the new Supabase client.
    supabaseClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            persistSession: false,
        },
    })

    return supabaseClient
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
    if (process.env.NODE_ENV !== "test") {
        throw new Error(
            "[DBCLIENT] _resetSupabaseClient_TEST_ONLY() was called outside of a test environment. This is strictly forbidden.",
        )
    }
    supabaseClient = null
}
