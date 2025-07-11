/**
 * @file This module provides a singleton Winston logger instance for the Lambda Engine.
 * It is designed to be environment-aware, providing human-readable, colorized output
 * in development and structured JSON output in production for optimal use with services
 * like AWS CloudWatch Logs.
 *
 * @features
 * - Singleton pattern: Ensures a single logger instance is used throughout the application.
 * - Environment-aware formatting: Switches between development and production log formats.
 * - Customizable service name: Allows logs to be tagged with a specific service identifier.
 * - Test-friendly: Includes a reset function for isolating tests.
 */
import winston, { Logger as WinstonLogger, format, transports } from "winston"

const { combine, timestamp, printf, colorize, json } = format

// Custom format for development logging, providing a clean, colorized, and readable output.
const devFormat = combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    // The printf format function allows for complete control over the log message structure.
    printf(({ level, message, timestamp: ts, service, ...metadata }) => {
        let metaString = ""
        // We check for metadata and serialize it to a JSON string if it's not empty.
        // This is useful for logging structured context alongside the main message.
        if (metadata && Object.keys(metadata).length) {
            // Filter out internal Winston properties to avoid cluttering the log output.
            const filteredMeta = Object.entries(metadata).reduce(
                (acc, [key, value]) => {
                    if (!["Symbol(level)", "Symbol(message)", "Symbol(splat)"].includes(key) && value !== undefined) {
                        acc[key] = value
                    }
                    return acc
                },
                {} as Record<string, any>,
            )
            if (Object.keys(filteredMeta).length > 0) {
                metaString = ` ${JSON.stringify(filteredMeta)}`
            }
        }
        return `${ts} [${service || "app"}] ${level}:${message}${metaString}`
    }),
)

// Standard JSON format for production logging. This is essential for log aggregation,
// searching, and analysis in cloud environments like AWS CloudWatch.
const prodFormat = combine(timestamp(), json())

/**
 * Defines the configuration options for initializing the logger.
 */
export interface LoggerOptions {
    /** The minimum log level to capture (e.g., 'debug', 'info', 'warn', 'error'). */
    level: string
    /** The runtime environment (e.g., 'development', 'production', 'test'). */
    nodeEnv: string
    /** An optional service name to tag logs, defaulting to 'lambda-engine'. */
    serviceName?: string
}

/**
 * The singleton logger instance. It is initialized on the first call to `initializeLogger`.
 * @type {WinstonLogger | undefined}
 */
let loggerInstance: WinstonLogger | undefined

/**
 * Initializes and returns a singleton Winston logger instance.
 *
 * This function is the main entry point for accessing the logger. It ensures that
 * the logger is created only once and configured according to the provided options
 * and environment.
 *
 * @param {LoggerOptions} options - Configuration options for the logger.
 * @returns {WinstonLogger} The configured Winston logger instance.
 */
/**
 * Initializes and returns a singleton Winston logger instance.
 *
 * This function ensures the logger is created only once per invocation. It selects a
 * log format based on the environment and applies the provided configuration.
 *
 * @param {LoggerOptions} options - Configuration options for the logger.
 * @returns {WinstonLogger} The configured Winston logger instance.
 */
export function initializeLogger({ level, nodeEnv, serviceName = "lambda-engine" }: LoggerOptions): WinstonLogger {
    // Step 1: Return the cached instance if it already exists.
    if (loggerInstance) {
        return loggerInstance
    }

    // Step 2: Select the appropriate log format based on the environment.
    const selectedFormat = nodeEnv === "production" ? prodFormat : devFormat

    // Step 3: Create, cache, and return the new logger instance.
    loggerInstance = winston.createLogger({
        level: level || "info",
        format: selectedFormat,
        defaultMeta: { service: serviceName },
        transports: [
            new transports.Console(),
            // In a real production setup, we might add a transport for CloudWatch Logs
            // here, e.g., using a library like 'winston-cloudwatch'.
        ],
        exitOnError: false, // Prevents the application from crashing on logger errors.
    })

    if (nodeEnv !== "production") {
        loggerInstance.debug("[LOGGER] Logger initialized for development/test environment.")
    }

    return loggerInstance
}

/**
 * A type alias for the Winston Logger for convenience.
 * Consumers of the logger can use this type for better type safety.
 */
export { WinstonLogger as Logger }

/**
 * Resets the internal logger instance.
 *
 * **THIS IS FOR TESTING PURPOSES ONLY AND SHOULD NOT BE USED IN PRODUCTION CODE.**
 *
 * It allows tests to create a fresh logger instance for each test case, ensuring
 * isolation and preventing state leakage between tests.
 *
 * @throws {Error} If called outside of a 'test' environment.
 */
export function _resetLoggerInstance_TEST_ONLY(): void {
    if (process.env.NODE_ENV === "test") {
        loggerInstance = undefined
    } else {
        // Throw an error instead of just warning to make misuse more apparent.
        throw new Error("_resetLoggerInstance_TEST_ONLY was called outside of a test environment. This is not allowed.")
    }
}
