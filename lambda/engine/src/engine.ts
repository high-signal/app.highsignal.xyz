/**
 * @file This file contains the core orchestration logic for the Lambda Engine.
 * It is responsible for initializing services, processing incoming Lambda events,
 * and invoking the appropriate platform-specific adapter to execute the main workflow.
 */

import { initializeLogger, Logger } from "./logger"
import { getAppConfig, getDiscourseAdapterRuntimeConfig } from "./config"
import { getSupabaseClient } from "./dbClient"
import { AIOrchestrator } from "./aiOrchestrator"

/**
 * Defines the options required to run the engine for a specific user and project.
 */
interface EngineRunOptions {
    userId?: string
    projectId?: number
}

/**
 * The core orchestration function for the Lambda Engine.
 *
 * This function initializes all necessary services (config, logger, DB client),
 * dynamically imports and instantiates the specified platform adapter, and invokes
 * the user-processing workflow.
 *
 * @param platformName - The name of the platform adapter to run (e.g., 'discourse').
 * @param options - The engine run options, containing the userId and projectId.
 * @param logger - An optional logger instance. If not provided, one will be initialized.
 * @throws An error if the platform is unsupported or if any step in the process fails.
 */
export async function runEngine(platformName: string, options: EngineRunOptions, logger?: Logger): Promise<void> {
    let effectiveLogger = logger
    const config = await getAppConfig() // Get config first

    if (!effectiveLogger) {
        effectiveLogger = initializeLogger({
            serviceName: `lambda-engine-${platformName}`,
            level: config.LOG_LEVEL,
            nodeEnv: config.NODE_ENV,
        })
    }

    effectiveLogger.info(`Lambda Engine run started for platform: ${platformName}`)

    try {
        effectiveLogger.info("Configuration loaded successfully.")

        const { userId, projectId } = options
        if (!userId || !projectId) {
            throw new Error("userId and projectId are required in the event payload for the user-centric workflow.")
        }

        // Initialize core services
        await getSupabaseClient() // Ensures DB client is ready
        const aiOrchestrator = new AIOrchestrator(config, effectiveLogger)

        // Dynamically import the adapter based on the platformName to keep the engine decoupled.
        const adapterPath = `@${platformName.toLowerCase()}/adapter`
        effectiveLogger.info(`Dynamically importing adapter from: ${adapterPath}`)
        const adapterModule = await import(adapterPath)

        // Construct the adapter class name from the platform name (e.g., 'discourse' -> 'DiscourseAdapter')
        const adapterClassName = `${platformName.charAt(0).toUpperCase() + platformName.slice(1)}Adapter`
        const AdapterClass = adapterModule[adapterClassName]

        if (!AdapterClass) {
            throw new Error(`Adapter class '${adapterClassName}' not found in module '${adapterPath}'`)
        }

        // TODO: The config loading should also be made dynamic and not be specific to Discourse.
        // This is a temporary measure to get the build to pass.
        const discourseConfig = await getDiscourseAdapterRuntimeConfig()

        const adapter = new AdapterClass(effectiveLogger, aiOrchestrator, discourseConfig)

        // Execute the main user processing logic within the adapter
        await adapter.processUser(userId, projectId, discourseConfig.aiConfig)

        effectiveLogger.info(`Successfully completed engine run for platform '${platformName}' and user '${userId}'.`)
    } catch (error: any) {
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
    // Initialize a logger instance specifically for this handler invocation.
    // The serviceName could include context information if available and useful.
    const config = await getAppConfig() // Get config first
    const logger = initializeLogger({
        serviceName: "lambda-engine-handler",
        level: config.LOG_LEVEL,
        nodeEnv: config.NODE_ENV,
    })

    logger.info("Lambda handler invoked.", {
        awsRequestId: context?.awsRequestId,
    })

    const { platformName, userId, projectId } = event

    // Validate the essential parameters from the event payload
    if (!platformName || !userId || !projectId) {
        const errorMessage = "Invalid event payload. `platformName`, `userId`, and `projectId` are required."
        logger.error(errorMessage, { event })
        throw new Error(errorMessage)
    }

    try {
        // Pass the event properties to the engine
        await runEngine(platformName, { userId, projectId }, logger)
        logger.info(`Handler successfully completed processing for platform: ${platformName}`)
    } catch (error) {
        logger.error(`Handler failed processing for platform: ${platformName}.`, {
            error,
        })
        // Re-throw to ensure Lambda marks the invocation as failed.
        throw error
    }
}
