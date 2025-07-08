/**
 * @file Defines the internal data structures and types for the Lambda Engine.
 * It imports shared data structures from the @shared module and defines
 * types specific to the engine's orchestration and AI processing logic.
 */

import type {
    Database,
    PlatformOutput,
    UserSignalStrength,
    Prompt,
    User,
    ForumUser,
    AiConfig,
    RawScore,
    SmartScoreOutput,
    // Import the newly shared types
    AdapterConfig,
    AdapterRuntimeConfig,
    PlatformAdapter,
    PlatformAdapterConstructor,
    AIScoreOutput,
    ModelConfig, // Now imported from shared
} from "@shared/types"

// Re-export shared types for consumers of the engine module
export type {
    PlatformOutput,
    UserSignalStrength,
    Prompt,
    User,
    ForumUser,
    Database,
    AiConfig,
    RawScore,
    SmartScoreOutput,
    // Re-export the newly shared types
    AdapterConfig,
    AdapterRuntimeConfig,
    PlatformAdapter,
    PlatformAdapterConstructor,
    AIScoreOutput,
    ModelConfig, // Re-exported
}

// ==========================================================================
// AI & CONFIGURATION TYPES (Engine-Specific)
// ==========================================================================

// ModelConfig has been moved to shared/types.ts

// ==========================================================================
// SERVICE INTERFACES (Engine-Specific)
// ==========================================================================

/**
 * Interface for a generic AI service client.
 * Implementations of this interface will handle communication with specific AI providers.
 */
export interface AIServiceClient {
    /**
     * Sends a prompt to an AI model and expects a structured response.
     * @param prompt The fully constructed prompt string to send to the AI model.
     * @param modelConfig Configuration settings for the AI model.
     * @returns A Promise that resolves to an AIScoreOutput object from the shared types.
     */
    getStructuredResponse(prompt: string, modelConfig: ModelConfig): Promise<AIScoreOutput>
}

