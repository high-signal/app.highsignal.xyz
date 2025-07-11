/**
 * @file This file contains the core orchestration logic for the Lambda Engine.
 * It is responsible for initializing services, processing incoming Lambda events,
 * and invoking the appropriate platform-specific adapter to execute the main workflow.
 */

import { initializeLogger, Logger } from "./logger"
import { getAppConfig, getPlatformAdapterConfig, getAdapterRuntimeConfig } from "./config"
import { getSupabaseClient } from "./dbClient"
import { AIOrchestrator } from "./aiOrchestrator"
import { PlatformAdapter, PlatformAdapterConstructor } from "./types"
import { DiscourseAdapter } from "@discourse/adapter"
import { DiscourseAdapterSecretsSchema } from "@discourse/config"

// --- Static Adapter Imports ---
// Statically import all available platform adapters.
// This is crucial for bundlers like Webpack (used by Next.js) to correctly resolve the modules.
// import { TwitterAdapter } from "@twitter/adapter" // Placeholder for when Twitter adapter is implemented
// import { DiscordAdapter } from "@discord/adapter" // Placeholder for when Discord adapter is implemented

/**
 * A map holding the constructor and configuration schema for each platform adapter.
 * This allows the engine to dynamically select and instantiate the correct adapter at runtime
 * without using dynamic `import()` statements.
 */
const ADAPTER_REGISTRY: Record<string, { constructor: PlatformAdapterConstructor<any>; schema: any }> = {
    discourse: { constructor: DiscourseAdapter, schema: DiscourseAdapterSecretsSchema },
    // twitter: { constructor: TwitterAdapter, schema: TwitterAdapterConfigSchema },
    // discord: { constructor: DiscordAdapter, schema: DiscordAdapterConfigSchema },
}

/**
 * Defines the options required to run the engine for a specific user and project.
 */
interface EngineRunOptions {
    userId?: string
    projectId?: string
    signalStrengthName?: string
}

/**
 * The core orchestration function for the Lambda Engine.
 *
 * This function initializes all necessary services (config, logger, DB client),
 * selects the appropriate platform adapter from the registry, and invokes
 * the user-processing workflow.
 *
 * @param platformName - The name of the platform adapter to run (e.g., 'discourse').
 * @param options - The engine run options, containing the userId and projectId.
 * @param logger - An optional logger instance. If not provided, one will be initialized.
 * @throws An error if the platform is unsupported or if any step in the process fails.
 */
export async function runEngine(platformName: string, options: EngineRunOptions, logger?: Logger): Promise<void> {
    // Phase 1: Initialization
    let effectiveLogger = logger
    const appConfig = await getAppConfig() // Get app config first

    if (!effectiveLogger) {
        effectiveLogger = initializeLogger({
            serviceName: `lambda-engine-${platformName}`,
            level: appConfig.LOG_LEVEL,
            nodeEnv: appConfig.NODE_ENV,
        })
    }

    effectiveLogger.info(`Lambda Engine run started for platform: ${platformName}`)

    try {
        // Phase 2: Input Validation
        const { userId, projectId, signalStrengthName: signalStrengthNameFromOptions } = options
        if (!userId || !projectId) {
            throw new Error("userId and projectId are required in the event payload for the user-centric workflow.")
        }

        // Phase 3: Adapter Selection
        const adapterInfo = ADAPTER_REGISTRY[platformName.toLowerCase()]
        if (!adapterInfo) {
            throw new Error(`Unsupported platform: '${platformName}'. No adapter found in registry.`)
        }

        effectiveLogger.info(`Adapter found for platform: ${platformName}`)

        // Phase 4: Core Service Initialization
        const supabase = await getSupabaseClient() // Ensures DB client is ready
        const aiOrchestrator = new AIOrchestrator(appConfig, effectiveLogger, supabase)

        // Phase 5: Dynamic Configuration Loading

        // Determine signal strength name and fetch its ID
        const signalStrengthName =
            signalStrengthNameFromOptions ||
            (platformName.toLowerCase() === "discourse" ? "discourse_forum" : undefined)

        if (!signalStrengthName) {
            throw new Error(
                `Could not determine signalStrengthName for platform '${platformName}'. Please provide it in the event payload.`,
            )
        }
        effectiveLogger.info(`Using signal strength name: ${signalStrengthName}`)

        const { data: signalStrengthData, error: signalStrengthError } = await supabase
            .from("signal_strengths")
            .select("id")
            .eq("name", signalStrengthName)
            .single()

        if (signalStrengthError || !signalStrengthData) {
            const dbError = `Failed to fetch signal strength ID for name '${signalStrengthName}'.`
            effectiveLogger.error(dbError, { error: signalStrengthError })
            throw new Error(dbError)
        }
        const signalStrengthId = signalStrengthData.id
        effectiveLogger.info(`Found signal strength ID: ${signalStrengthId}`)

        // Fetch project enabled state from project_signal_strengths table
        const { data: isProjectEnabled, error: isProjectEnabledError } = await supabase
            .from("project_signal_strengths")
            .select("enabled")
            .eq("project_id", projectId)
            .eq("signal_strength_id", signalStrengthId)
            .single()

        if (isProjectEnabledError) {
            const dbError = `Failed to fetch enabled state for project ID '${projectId}' and signal strength ID '${signalStrengthId}'.`
            effectiveLogger.error(dbError, { error: isProjectEnabledError })
            throw new Error(dbError)
        }

        if (!isProjectEnabled.enabled) {
            effectiveLogger.info(`[DBShared] Signal ${signalStrengthId} is disabled for project ${projectId}.`)
            return // or however the engine exits
        }

        const staticConfig = await getPlatformAdapterConfig(platformName, adapterInfo.schema)

        const combinedConfig = {
            ...staticConfig,
            PROJECT_ID: projectId,
            SIGNAL_STRENGTH_ID: signalStrengthId,
        }
        delete combinedConfig.url // Remove the 'url' property from the adapter's configuration object

        const runtimeConfig = await getAdapterRuntimeConfig(supabase, combinedConfig)
        const effectiveConfig = { ...combinedConfig, ...runtimeConfig }

        // Phase 6: Adapter Instantiation & Execution
        const AdapterClass = adapterInfo.constructor
        const adapter = new AdapterClass(effectiveLogger, aiOrchestrator, supabase, effectiveConfig)

        await adapter.processUser(userId, projectId.toString(), runtimeConfig.aiConfig)

        effectiveLogger.info(`Successfully completed engine run for platform '${platformName}' and user '${userId}'.`)
    } catch (error: any) {
        // Error Handling
        effectiveLogger.error(`Critical error during Lambda Engine run for platform '${platformName}'.`, {
            errorMessage: error.message,
            stack: error.stack,
        })
        // Re-throw the error so that the Lambda execution environment can mark the invocation as failed.
        throw error
    }
}

/**
 * AWS Lambda handler function.
 *
 * This is the entry point for the Lambda invocation. It is responsible for:
 * 1. Parsing and validating the incoming event payload.
 * 2. Initializing a logger with context from the invocation.
 * 3. Calling the `runEngine` function to execute the core logic.
 * 4. Handling any top-level errors and ensuring they are logged.
 *
 * @param event - The event object from AWS Lambda. Expected to contain `platformName`, `userId`, and `projectId`.
 * @param context - The AWS Lambda context object, providing runtime information.
 * @returns A promise that resolves upon completion.
 * @throws An error if the event payload is invalid or if the engine fails.
 */
export async function handler(event: any, context: any): Promise<void> {
    // Step 1: Initialize logger and configuration.
    // Initialize a logger instance specifically for this handler invocation.
    const config = await getAppConfig() // Get config first
    const logger = initializeLogger({
        serviceName: "lambda-engine-handler",
        level: config.LOG_LEVEL,
        nodeEnv: config.NODE_ENV,
    })

    logger.info("Lambda handler invoked.", {
        awsRequestId: context?.awsRequestId,
    })

    // Step 2: Parse and validate the incoming event payload.
    const { platformName, userId, projectId, signalStrengthName } = event

    if (!platformName || !userId || !projectId) {
        const errorMessage = "Invalid event payload. `platformName`, `userId`, and `projectId` are required."
        logger.error(errorMessage, { event })
        throw new Error(errorMessage)
    }

    // Step 3: Execute the core engine logic.
    try {
        await runEngine(platformName, { userId, projectId, signalStrengthName }, logger)
        logger.info(`Handler successfully completed processing for platform: ${platformName}`)
    } catch (error) {
        // Step 4: Log any critical errors from the engine run.
        logger.error(`Handler failed processing for platform: ${platformName}.`, {
            error,
        })
        // Re-throw to ensure Lambda marks the invocation as failed.
        throw error
    }
}
