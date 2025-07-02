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
 * It is based on the original output of the legacy Discourse scripts.
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
export type UserSignalStrength = Database["public"]["Tables"]["user_signal_strengths"]["Insert"]

/**
 * Represents a row from the 'prompts' table.
 * Contains a specific prompt template and its metadata.
 */
export type Prompt = Tables<"prompts">

/**
 * Represents a row from the 'users' table.
 * Contains core information about a user across all platforms.
 */
export type User = Tables<"users">

/**
 * Represents a row from the 'forum_users' table.
 * This table links a user from the 'users' table to their platform-specific identity.
 */
export type ForumUser = Tables<"forum_users">

/**
 * Represents a row from the 'projects' table.
 */
export type Project = Tables<"projects">

/**
 * Represents a row from the 'project_signal_strengths' table,
 * which configures a signal for a specific project.
 */
export type ProjectSignalStrength = Tables<"project_signal_strengths">

// ==========================================================================
// 4. ENGINE & CALCULATION TYPES
// These types are used by the engine and adapters for AI configuration and scoring.
// ==========================================================================

/**
 * Represents the comprehensive AI configuration for a specific signal strength,
 * combining details from both the 'signal_strengths' and 'prompts' tables.
 */
export interface AiConfig {
    signalStrengthId: number
    model: string
    temperature: number
    maxChars: number
    prompts: Prompt[]
    maxValue: number
    previous_days: number | null
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
