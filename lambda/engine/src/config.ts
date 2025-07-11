/**
 * @file Manages all configuration for the Lambda Engine.
 *
 * This module provides a centralized and environment-aware way to handle configuration.
 * - In **production**, it securely fetches secrets from AWS Secrets Manager.
 * - In **development/test**, it loads variables from a local `.env` file.
 * - It uses **Zod** for robust schema validation and type inference.
 * - It **caches** configurations to improve performance by avoiding redundant fetches.
 */

import { z } from "zod"
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager"
import { SupabaseClient } from "@supabase/supabase-js"
import { AdapterConfig, AdapterRuntimeConfig, AiConfig } from "./types"
import { getLegacySignalConfig as fetchAiConfigFromDb } from "@shared/db"

// --- Zod Schemas for Configuration Validation ---

/**
 * Defines the schema for the core application configuration.
 * These are settings required for the engine to operate, regardless of the platform adapter.
 */

export const AppConfigSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    LOG_LEVEL: z.string().default("info"),
    SUPABASE_URL: z.string(),
    SUPABASE_SERVICE_ROLE_KEY: z.string(),
    OPENAI_API_KEY: z.string(),
    ENABLE_USER_CENTRIC_WORKFLOW: z.preprocess(
        (val) => val ?? "false",
        z.string().transform((s) => s.toLowerCase() === "true"),
    ),
})
export type AppConfig = z.infer<typeof AppConfigSchema>

// --- Caching ---
// Caches store fetched configurations and secrets to prevent redundant API calls
// within a single Lambda invocation, improving performance and reducing costs.

let appConfigCache: AppConfig | null = null
const platformAdapterConfigCache: Record<string, AdapterConfig | null> = {}
const secretsCache: Record<string, any> = {}

// --- Helper Functions ---

/**
 * Fetches, validates, and caches a secret from AWS Secrets Manager.
 *
 * @param secretName The name (or ARN) of the secret in AWS Secrets Manager.
 * @param schema The Zod schema to validate the secret's structure.
 * @returns A promise that resolves to the validated secret object.
 * @throws An error if the secret cannot be fetched, is empty, or fails validation.
 */
async function getSecret<T>(secretName: string, schema: z.ZodType<T>): Promise<T> {
    // Step 1: Check the cache first to avoid redundant API calls.
    if (secretsCache[secretName]) {
        return secretsCache[secretName]
    }

    // Step 2: If not cached, fetch the secret from AWS Secrets Manager.
    const client = new SecretsManagerClient({})
    const command = new GetSecretValueCommand({ SecretId: secretName })

    try {
        const data = await client.send(command)

        // Step 3: Parse, validate, and cache the secret before returning.
        if (data.SecretString) {
            const parsedSecrets = JSON.parse(data.SecretString)
            const validatedSecrets = schema.parse(parsedSecrets)
            secretsCache[secretName] = validatedSecrets
            return validatedSecrets
        } else {
            throw new Error(`[CONFIG] Secret string is empty for secret: ${secretName}`)
        }
    } catch (error: any) {
        // Step 4: Handle validation or fetching errors.
        if (error instanceof z.ZodError) {
            const errorMessage = error.errors.map((e) => `${e.path.join(".")} - ${e.message}`).join(", ")
            throw new Error(`[CONFIG] Invalid configuration for ${secretName}: ${errorMessage}`)
        }
        throw new Error(`[CONFIG] Failed to fetch secret ${secretName}: ${error.message}`)
    }
}

// --- Exported Configuration Getters ---

/**
 * Retrieves the core application configuration.
 *
 * It follows a specific loading priority:
 * 1. Cached configuration (if available).
 * 2. AWS Secrets Manager (for production environment only).
 * 3. Environment variables (`process.env`).
 *
 * In production, any environment variable will override a value fetched from Secrets Manager.
 * In local development, it loads from a `.env` file.
 *
 * @returns A promise that resolves to the validated application configuration.
 */
export async function getAppConfig(): Promise<AppConfig> {
    // Step 1: Check the cache first.
    if (appConfigCache) {
        return appConfigCache
    }

    try {
        // Step 2: In production, attempt to fetch secrets from AWS Secrets Manager.
        let secrets = {}
        if (process.env.NODE_ENV === "production") {
            try {
                const secretName = "highsignal/production/app"
                // Fetch secrets, but don't fail if they don't exist. Env vars might be used instead.
                secrets = await getSecret(secretName, AppConfigSchema.partial())
            } catch (error) {
                console.warn(
                    `[CONFIG] Could not fetch app secrets from Secrets Manager. Falling back to environment variables. Error: ${error}`,
                )
            }
        }

        // Combine sources: environment variables override secrets.
        const combinedConfig = {
            ...secrets,
            ...process.env,
        }

        appConfigCache = AppConfigSchema.parse(combinedConfig)
        return appConfigCache
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessage = error.errors.map((e) => `${e.path.join(".")} - ${e.message}`).join(", ")
            throw new Error(`[CONFIG] Invalid application configuration: ${errorMessage}`)
        }
        throw error
    }
}

/**
 * Retrieves the static configuration for a specific platform adapter.
 *
 * It follows a specific loading priority:
 * 1. Cached configuration (if available).
 * 2. AWS Secrets Manager (for production environment only).
 * 3. Environment variables (prefixed with the platform name, e.g., `DISCOURSE_API_URL`).
 *
 * In production, any environment variable will override a value fetched from Secrets Manager.
 *
 * @param platformName The name of the platform (e.g., 'discourse').
 * @param schema The Zod schema used to validate the adapter's configuration.
 * @returns A promise that resolves to the validated adapter configuration.
 * @throws An error if the configuration fails validation.
 */
export async function getPlatformAdapterConfig<T extends z.AnyZodObject>(
    platformName: string,
    schema: T,
): Promise<z.infer<T>> {
    // Step 1: Check the cache first.
    const cacheKey = platformName.toLowerCase()
    if (platformAdapterConfigCache[cacheKey]) {
        // We cast to `unknown` first because the cached `AdapterConfig` and the specific
        // inferred type `z.infer<T>` are not directly related in the type system,
        // even though we know logically they are compatible.
        return platformAdapterConfigCache[cacheKey] as unknown as z.infer<T>
    }

    try {
        let secrets = {}
        if (process.env.NODE_ENV === "production") {
            try {
                const secretName = `highsignal/production/${cacheKey}`
                secrets = await getSecret(secretName, schema.partial())
            } catch (error) {
                console.warn(
                    `[CONFIG] Could not fetch ${platformName} secrets from Secrets Manager. Falling back to environment variables. Error: ${error}`,
                )
            }
        }

        // Step 3: Load configuration from environment variables.
        const envConfig: Record<string, string | undefined> = {}
        for (const key in (schema as any).shape) {
            // Check for existence, not truthiness, to allow for empty strings.
            if (process.env[key] !== undefined) {
                envConfig[key] = process.env[key]
            }
        }

        // Combine sources: environment variables override secrets.
        const combinedConfig = {
            ...secrets,
            ...envConfig,
        }

        // Step 4: Validate the combined configuration and cache it.
        const parsedConfig = schema.parse(combinedConfig)
        platformAdapterConfigCache[cacheKey] = parsedConfig as AdapterConfig
        return parsedConfig
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessage = error.errors.map((e) => `${e.path.join(".")} - ${e.message}`).join(", ")
            throw new Error(`[CONFIG] Invalid ${platformName} adapter configuration: ${errorMessage}`)
        }
        throw error
    }
}

/**
 * Retrieves the full runtime configuration for an adapter by combining its static config
 * with dynamic AI configuration fetched from the database.
 *
 * @param supabase The Supabase client for database interactions.
 * @param config The static configuration object for the adapter.
 * @returns A promise that resolves to the complete `AdapterRuntimeConfig`.
 * @throws An error if the AI configuration cannot be fetched.
 */
export const getAdapterRuntimeConfig = async <T extends AdapterConfig>(
    supabase: SupabaseClient,
    config: T,
): Promise<AdapterRuntimeConfig<T>> => {
    // Step 1: Fetch the dynamic AI configuration from the database.
    const aiConfig = await fetchAiConfigFromDb(
        supabase,
        config.SIGNAL_STRENGTH_ID,
        // Project ID is now a string UUID and is passed directly, as the DB function expects a string.
        config.PROJECT_ID,
    )

    // Step 2: Validate that the AI configuration was successfully fetched.
    if (!aiConfig) {
        throw new Error(
            `[CONFIG] Failed to fetch required AI configuration for signal strength ID: ${config.SIGNAL_STRENGTH_ID}`,
        )
    }

    // Step 3: Combine static and dynamic configs into the final runtime config.
    return {
        ...config,
        aiConfig,
    }
}

/**
 * Resets the internal configuration caches for testing purposes.
 *
 * @warning This function is intended exclusively for use in isolated test environments.
 * Calling it in a production or development environment will throw an error.
 * It ensures that tests run in a clean state without interference from cached data.
 */
export function _resetConfigCache_TEST_ONLY(): void {
    if (process.env.NODE_ENV !== "test") {
        throw new Error(
            "[CONFIG] _resetConfigCache_TEST_ONLY() was called outside of a test environment. This is strictly forbidden.",
        )
    }

    appConfigCache = null
    for (const key in platformAdapterConfigCache) {
        delete platformAdapterConfigCache[key]
    }
    for (const key in secretsCache) {
        delete secretsCache[key]
    }
}
