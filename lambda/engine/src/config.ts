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
// Caches are used to store fetched configurations and secrets, preventing redundant
// calls to AWS Secrets Manager or the database within a single Lambda invocation.

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
    if (secretsCache[secretName]) {
        return secretsCache[secretName]
    }

    const client = new SecretsManagerClient({})
    const command = new GetSecretValueCommand({ SecretId: secretName })

    try {
        const data = await client.send(command)
        if (data.SecretString) {
            const parsedSecrets = JSON.parse(data.SecretString)
            const validatedSecrets = schema.parse(parsedSecrets)
            secretsCache[secretName] = validatedSecrets
            return validatedSecrets
        } else {
            throw new Error(`[CONFIG] Secret string is empty for secret: ${secretName}`)
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessage = error.errors.map((e) => `${e.path.join(".")} - ${e.message}`).join(", ")
            throw new Error(`[CONFIG] Invalid configuration for ${secretName}: ${errorMessage}`)
        }
        throw new Error(`[CONFIG] Failed to fetch secret ${secretName}: ${error}`)
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
    if (appConfigCache) {
        return appConfigCache
    }



    try {
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
 * In local development, it loads from a `.env` file.
 *
 * @param platformName The name of the platform (e.g., 'discourse').
 * @param schema The Zod schema for the adapter's configuration.
 * @returns A promise that resolves to the validated adapter configuration.
 */
export async function getPlatformAdapterConfig<T extends z.AnyZodObject>(
    platformName: string,
    schema: T,
): Promise<z.infer<T>> {
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

        // Dynamically create a mapping from the environment variables.
        // The keys in the Zod schema are the names of the environment variables.
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

        const parsedConfig = schema.parse(combinedConfig)
        // We assert that the parsed config is compatible with the base `AdapterConfig`
        // for caching, as the generic constraint isn't enough for the compiler.
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
 * Retrieves the full runtime configuration for a platform adapter.
 *
 * This function orchestrates fetching both the static adapter configuration
 * and the dynamic AI configuration from the database.
 *
 * @param config The static configuration object for the adapter.
 * @returns A promise that resolves to the complete runtime configuration for the adapter.
 */
export const getAdapterRuntimeConfig = async <T extends AdapterConfig>(
    supabase: SupabaseClient,
    config: T,
): Promise<AdapterRuntimeConfig<T>> => {
    const aiConfig = await fetchAiConfigFromDb(
        supabase,
        config.SIGNAL_STRENGTH_ID,
        // Project ID is now a string UUID and is passed directly, as the DB function expects a string.
        config.PROJECT_ID,
    )

    if (!aiConfig) {
        throw new Error(
            `[CONFIG] Failed to fetch required AI configuration for signal strength ID: ${config.SIGNAL_STRENGTH_ID}`,
        )
    }

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
