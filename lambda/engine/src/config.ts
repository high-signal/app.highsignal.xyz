/**
 * @file Manages all configuration for the Lambda Engine.
 *
 * This module provides a centralized and environment-aware way to handle configuration.
 * - In **production**, it securely fetches secrets from AWS Secrets Manager.
 * - In **development/test**, it loads variables from a local `.env` file.
 * - It uses **Zod** for robust schema validation and type inference.
 * - It **caches** configurations to improve performance by avoiding redundant fetches.
 */

import * as dotenv from "dotenv"
import * as path from "path"
import { z } from "zod"
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager"
import { AiConfig } from "./types"
import { getLegacySignalConfig as fetchAiConfigFromDb } from "./dbClient"

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

/**
 * Defines the schema for the Discourse platform adapter's static configuration.
 * These are settings specific to connecting to a Discourse instance.
 */

export const DiscourseAdapterConfigSchema = z.object({
    API_URL: z.string(),
    API_KEY: z.string(),
    PROJECT_ID: z.coerce.number(),
    SIGNAL_STRENGTH_ID: z.coerce.number(),
    MAX_VALUE: z.coerce.number().optional(),
})
export type DiscourseAdapterConfig = z.infer<typeof DiscourseAdapterConfigSchema>

/**
 * Represents the complete runtime configuration for the Discourse adapter.
 * It combines the static adapter configuration with the dynamic AI configuration
 * fetched from the database at runtime.
 */

export type DiscourseAdapterRuntimeConfig = DiscourseAdapterConfig & {
    aiConfig: AiConfig
}

// --- Caching ---
// Caches are used to store fetched configurations and secrets, preventing redundant
// calls to AWS Secrets Manager or the database within a single Lambda invocation.

let appConfigCache: AppConfig | null = null
let discourseAdapterConfigCache: DiscourseAdapterConfig | null = null
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
 * 2. Environment variables (`process.env`).
 * 3. AWS Secrets Manager (for production environment only).
 *
 * In production, any environment variable will override a value fetched from Secrets Manager.
 * In local development, it loads from a `.env` file.
 *
 * @returns A promise that resolves to the validated application configuration.
 */
export const getAppConfig = async (): Promise<AppConfig> => {
    if (appConfigCache) {
        return appConfigCache
    }

    const isProduction = process.env.NODE_ENV === "production"
    if (!isProduction) {
        // For local development, load variables from .env file in the project root.
        dotenv.config({ path: path.resolve(__dirname, "../../..", ".env") })
    }

    try {
        let secrets = {}
        if (isProduction) {
            try {
                const secretName = "highsignal/production/app"
                // Fetch secrets, but don't fail if they don't exist. Env vars might be used instead.
                // We use a partial schema here because we don't require all secrets to be present.
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
            ...process.env, // process.env values will overwrite any from secrets
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
 * Retrieves the static configuration for the Discourse platform adapter.
 *
 * It follows a specific loading priority:
 * 1. Cached configuration (if available).
 * 2. Environment variables (`DISCOURSE_*` prefixed).
 * 3. AWS Secrets Manager (for production environment only).
 *
 * In production, any environment variable will override a value fetched from Secrets Manager.
 * In local development, it loads from a `.env` file.
 *
 * @returns A promise that resolves to the validated Discourse adapter configuration.
 */
export const getDiscourseAdapterConfig = async (): Promise<DiscourseAdapterConfig> => {
    if (discourseAdapterConfigCache) {
        return discourseAdapterConfigCache
    }

    const isProduction = process.env.NODE_ENV === "production"
    if (!isProduction) {
        dotenv.config({ path: path.resolve(__dirname, "../../..", ".env") })
    }

    try {
        let secrets = {}
        if (isProduction) {
            try {
                const secretName = "highsignal/production/discourse"
                // Fetch secrets, but don't fail if they don't exist. Env vars might be used instead.
                secrets = await getSecret(secretName, DiscourseAdapterConfigSchema.partial())
            } catch (error) {
                console.warn(
                    `[CONFIG] Could not fetch Discourse secrets from Secrets Manager. Falling back to environment variables. Error: ${error}`,
                )
            }
        }

        // Remap from DISCOURSE_ prefixed env vars for local dev and overrides
        const envConfig = {
            API_URL: process.env.DISCOURSE_API_URL,
            API_KEY: process.env.DISCOURSE_API_KEY,
            PROJECT_ID: process.env.DISCOURSE_PROJECT_ID,
            SIGNAL_STRENGTH_ID: process.env.DISCOURSE_SIGNAL_STRENGTH_ID,
            MAX_VALUE: process.env.DISCOURSE_MAX_VALUE,
        }

        // Filter out undefined values from envConfig so they don't overwrite secrets with `undefined`
        const definedEnvConfig = Object.fromEntries(
            Object.entries(envConfig).filter(([, value]) => value !== undefined),
        )

        // Combine sources: environment variables override secrets.
        const combinedConfig = {
            ...secrets,
            ...definedEnvConfig,
        }

        discourseAdapterConfigCache = DiscourseAdapterConfigSchema.parse(combinedConfig)
        return discourseAdapterConfigCache
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessage = error.errors.map((e) => `${e.path.join(".")} - ${e.message}`).join(", ")
            throw new Error(`[CONFIG] Invalid Discourse adapter configuration: ${errorMessage}`)
        }
        throw error
    }
}

/**
 * Retrieves the full runtime configuration for the Discourse adapter.
 *
 * This function orchestrates fetching both the static adapter configuration (env vars/secrets)
 * and the dynamic AI configuration (prompts, models) from the database.
 *
 * @returns A promise that resolves to the complete runtime configuration for the adapter.
 */
export const getDiscourseAdapterRuntimeConfig = async (): Promise<DiscourseAdapterRuntimeConfig> => {
    const config = await getDiscourseAdapterConfig()

    const aiConfig = await fetchAiConfigFromDb(config.SIGNAL_STRENGTH_ID, config.PROJECT_ID)

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
    discourseAdapterConfigCache = null
    for (const key in secretsCache) {
        delete secretsCache[key]
    }
}
