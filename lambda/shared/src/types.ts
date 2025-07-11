/**
 * @file This file serves as the single source of truth for all shared data structures in the project.
 * It imports the raw, auto-generated types from `supabase-types.ts` and then re-exports
 * the specific types needed by the various modules (engine, adapters, etc.).
 * This ensures consistency and avoids type duplication.
 */

import { Database, Json } from "./supabase-types"

// Extract the core schema types for easier access.
type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]

// ==========================================================================
// 1. CORE EXPORTS
// These are the fundamental types that will be used across the application.
// ==========================================================================

export type { Database, Json }

// ==========================================================================
// 2. STANDARDIZED ADAPTER-ENGINE INTERFACE
// ==========================================================================

/**
 * The standardized data structure that all platform adapters must produce.
 * This schema is critical for ensuring zero disruption to downstream systems.
 */
export interface PlatformOutput {
    /**
     * The unique identifier of the topic, post, or message from the source platform.
     * Can be a number (e.g., Discourse topic_id) or a string (e.g., Discord message ID).
     */
    topic_id: number | string

    /**
     * The username or identifier of the content author on the source platform.
     */
    author: string

    /**
     * The main text content of the post or message.
     */
    content: string

    /**
     * The creation timestamp of the content in ISO 8601 format (e.g., "2023-10-27T10:00:00Z").
     */
    timestamp: string

    /**
     * The number of replies to the content. Defaults to 0 if not applicable.
     */
    reply_count: number

    /**
     * The number of likes or reactions to the content. Defaults to 0 if not applicable.
     */
    like_count: number

    /**
     * An array of tags or keywords associated with the content.
     */
    tags: string[]

    /**
     * An optional field for any additional, platform-specific metadata that does not
     * fit into the core schema. This provides flexibility for future use cases.
     * Use with caution to avoid creating downstream dependencies on non-standard data.
     */
    metadata?: Record<string, any>
}

// ==========================================================================
// 3. RE-EXPORTED SUPABASE TABLE TYPES
// ==========================================================================

/**
 * Represents the structure for inserting a new entry into the 'user_signal_strengths' table.
 * This is the primary data structure for storing AI-generated scores.
 */
export type UserSignalStrength = Omit<
    Database["public"]["Tables"]["user_signal_strengths"]["Insert"],
    "project_id" | "signal_strength_id"
> & {
    project_id: string
    signal_strength_id: string
}

/**
 * Represents a row from the 'prompts' table.
 * Contains a specific prompt template and its metadata.
 */
export interface Prompt {
    id: number
    created_at: string
    signal_strength_id: string | null
    type: string | null
    prompt: string | null
}

/**
 * Represents a row from the 'users' table.
 * Contains core information about a user across all platforms.
 */
export type User = Tables<"users">

/**
 * Represents a row from the 'forum_users' table.
 * This table links a user from the 'users' table to their platform-specific identity.
 */
export type ForumUser = Omit<Tables<"forum_users">, "project_id"> & {
    project_id: string
}

/**
 * Represents a row from the 'projects' table.
 */
export type Project = Tables<"projects">

/**
 * Represents a row from the 'project_signal_strengths' table,
 * which configures a signal for a specific project.
 */
export type ProjectSignalStrength = Omit<Tables<"project_signal_strengths">, "project_id" | "signal_strength_id"> & {
    project_id: string
    signal_strength_id: string
}

// ==========================================================================
// 4. ENGINE & CALCULATION TYPES
// These types are used by the engine and adapters for AI configuration and scoring.
// ==========================================================================

/**
 * Configuration for a generic AI model call.
 * This is distinct from AiConfig, which includes database-specific details and prompts.
 */
export interface ModelConfig {
    /** The identifier of the AI model to be used (e.g., "gpt-3.5-turbo"). */
    model: string
    /** The temperature setting for the AI model, controlling randomness. */
    temperature: number
    /** Optional: Maximum number of tokens to generate in the completion. */
    maxTokens?: number
}

/**
 * Represents the comprehensive AI configuration for a specific signal strength,
 * combining details from both the 'signal_strengths' and 'prompts' tables.
 */
export interface AiConfig {
    signalStrengthId: string
    model: string
    temperature: number
    maxChars: number
    prompts: Prompt[]
    maxValue: number
    previous_days: number | null
    url: string
}

/**
 * Represents the data for a single raw score, used as input for the smart score calculation.
 */
export interface RawScore {
    raw_value: number
    max_value: number
    day: string // ISO date string 'YYYY-MM-DD'
}

/**
 * Represents the output of the deterministic smart score calculation.
 */
export interface SmartScoreOutput {
    smartScore: number
    topBandDays: string[]
}

// ==========================================================================
// 4. USER DATA STRUCTURES
// ==========================================================================

interface UserData {
    id?: number
    rank?: number
    score?: number
    peakSignalScore?: number
    signalStrengthScore?: number
    username?: string
    displayName?: string
    profileImageUrl?: string
    signal?: string
    projectSlug?: string
    projectData?: ProjectData
    peakSignals?: PeakSignalUserData[]
    signalStrengths?: {
        signalStrengthName: string
        data: SignalStrengthUserData[]
    }[]
    forumUsers?: ForumUser[]
    isSuperAdmin?: boolean
    connectedAccounts?: ConnectedAccount[]
    defaultProfile?: boolean
    email?: string
    discordUsername?: string
    xUsername?: string
    farcasterUsername?: string
}

interface ConnectedAccount {
    name: string
    data: ForumUser[]
}

interface PeakSignalUserData {
    name: string
    displayName: string
    value: number
    imageSrc: string
    imageAlt: string
}

interface SignalStrengthUserData {
    id?: number
    day: string
    name: string
    value: string
    maxValue: number
    summary: string
    description: string
    improvements: string
    explainedReasoning?: string
    model?: string
    promptId?: string
    prompt?: string
    temperature?: number
    maxChars?: number
    logs?: string
    promptTokens?: number
    completionTokens?: number
    lastChecked?: number
    rawValue?: number
    testRequestingUser?: number
}

interface ProjectData {
    id?: number
    urlSlug: string
    displayName: string
    projectLogoUrl: string
    peakSignalsEnabled: boolean
    peakSignalsMaxValue: number
    signalStrengths: SignalStrengthProjectData[]
}

interface SignalStrengthProjectData {
    id?: number
    name: string
    displayName: string
    status: string
    maxValue: number
    enabled: boolean
    previousDays: number
    promptId?: string
    prompt?: string
    model?: string
    temperature?: number
    maxChars?: number
    url?: string
    availableAuthTypes?: string[]
    authTypes?: string[]
}

// ==========================================================================
// AI & SCORING TYPES
// ==========================================================================

/**
 * Represents the structured output expected from the AI service after scoring.
 */
export interface AIScoreOutput {
    [key: string]: any // Allow for flexible, nested AI responses
    value: number
    summary: string
    description: string
    improvements: string
    explained_reasoning: string | { reason: string; value?: number }
    requestId?: string
    modelUsed?: string
    promptTokens?: number
    completionTokens?: number
}

/**
 * Represents the structured output for a smart score summary.
 */
export interface SmartScoreOutput {
    smartScore: number
    topBandDays: string[]
    summary: string
    description: string
    improvements: string
    explained_reasoning: string
    promptId: number | null
    requestId?: string
    promptTokens?: number
    completionTokens?: number
}

// ==========================================================================
// SERVICE INTERFACES
// ==========================================================================

/**
 * Defines the contract for the AI Orchestrator.
 * This allows adapters to use the orchestrator's functionality without a direct
 * dependency on the engine's implementation.
 */
/**
 * Represents the complete result from a raw score generation call,
 * including the AI score and all relevant run metadata.
 */
export interface RawScoreGenerationResult {
    score: AIScoreOutput
    promptId: number
    model: string
    temperature: number
    promptTokens: number
    completionTokens: number
    requestId: string
}

export interface IAiOrchestrator {
    generateRawScores(
        user: ForumUser,
        day: string,
        content: string,
        logs: string,
        signalConfig: AiConfig,
        projectId: string,
    ): Promise<UserSignalStrength | null>

    generateSmartScoreSummary(
        user: ForumUser,
        rawScores: Pick<UserSignalStrength, "day" | "raw_value" | "max_value">[],
        signalConfig: AiConfig,
        projectId: string,
    ): Promise<UserSignalStrength | null>
}

// ==========================================================================
// PLATFORM ADAPTER INTERFACE
// ==========================================================================

/**
 * Represents the basic configuration required by any platform adapter.
 * Each adapter will extend this with its own specific settings.
 */
export interface AdapterConfig {
    PROJECT_ID: string
    SIGNAL_STRENGTH_ID: string
}

/**
 * Represents the full runtime configuration for a platform adapter,
 * including the dynamic AI configuration.
 */
export type AdapterRuntimeConfig<T extends AdapterConfig> = T & {
    aiConfig: AiConfig
    aiOrchestrator?: IAiOrchestrator
}

/**
 * Defines the contract for all platform adapters.
 *
 * An adapter is a class that encapsulates the logic for interacting with a
 * specific platform (e.g., Discourse, Twitter) to fetch data and process users.
 */
export interface PlatformAdapter<T extends AdapterConfig> {
    /**
     * The main entry point for an adapter's logic.
     * It orchestrates the process of fetching data for a specific user,
     * analyzing it, and generating the required scores.
     *
     * @param userId The unique identifier of the user to process.
     * @param projectId The ID of the project this user belongs to.
     * @param aiConfig The AI configuration to use for scoring.
     */
    processUser(userId: string, projectId: string, aiConfig: AiConfig): Promise<void>
}

/**
 * Defines the constructor signature for a PlatformAdapter class.
 * This allows the engine to instantiate adapters in a generic way.
 */
export interface PlatformAdapterConstructor<T extends AdapterConfig> {
    new (
        logger: any, // Using `any` to avoid circular dependency issues with Logger type
        supabase: any, // Using `any` to avoid circular dependency issues with SupabaseClient
        aiOrchestrator: any, // Using `any` to avoid circular dependency issues
        config: AdapterRuntimeConfig<T>,
    ): PlatformAdapter<T>
}
