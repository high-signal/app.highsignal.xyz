/**
 * @file Defines Zod schemas and validation functions for core data structures.
 * This module ensures that data flowing into the engine from platform adapters
 * conforms to the required `PlatformOutput` schema, preventing runtime errors.
 */

import { z } from "zod"
import { PlatformOutput } from "./types"

/**
 * Zod schema for the `PlatformOutput` interface.
 * This provides runtime validation for the standardized data structure that all
 * platform adapters must produce. It includes detailed error messages for each field.
 */
export const PlatformOutputSchema = z.object({
    /**
     * The unique identifier of the topic, post, or message from the source platform.
     * Can be a number (e.g., Discourse topic_id) or a string (e.g., Discord message ID).
     */
    topic_id: z.union([z.number(), z.string()], {
        required_error: "topic_id is required",
        invalid_type_error: "topic_id must be a number or a string",
    }),

    /**
     * The username or identifier of the content author on the source platform.
     */
    author: z.string({
        required_error: "author is required",
        invalid_type_error: "author must be a string",
    }),

    /**
     * The main text content of the post or message.
     */
    content: z.string({
        required_error: "content is required",
        invalid_type_error: "content must be a string",
    }),

    /**
     * The creation timestamp of the content in ISO 8601 format (e.g., "2023-10-27T10:00:00Z").
     */
    timestamp: z.string().datetime({
        message: "timestamp must be a valid ISO 8601 date string",
    }),

    /**
     * The number of replies to the content. Defaults to 0 if not applicable.
     */
    reply_count: z.number().int().min(0, {
        message: "reply_count must be a non-negative integer",
    }),

    /**
     * The number of likes or reactions to the content. Defaults to 0 if not applicable.
     */
    like_count: z.number().int().min(0, {
        message: "like_count must be a non-negative integer",
    }),

    /**
     * An array of tags or keywords associated with the content.
     */
    tags: z.array(z.string(), {
        required_error: "tags is required and must be an array of strings",
        invalid_type_error: "tags must be an array of strings",
    }),

    /**
     * An optional field for any additional, platform-specific metadata that does not
     * fit into the core schema. This provides flexibility for future use cases.
     * Use with caution to avoid creating downstream dependencies on non-standard data.
     */
    metadata: z.record(z.any()).optional(),
})

/**
 * Validates an object against the PlatformOutput schema.
 * Throws a ZodError if validation fails.
 *
 * @param data The object to validate.
 * @returns The validated PlatformOutput object.
 * @throws ZodError if validation fails.
 */
export function validatePlatformOutput(data: unknown): PlatformOutput {
    return PlatformOutputSchema.parse(data)
}

/**
 * Safely validates an object against the PlatformOutput schema.
 * Returns a success or error result object instead of throwing.
 *
 * @param data The object to validate.
 * @returns A ZodSafeParseReturnType object indicating success or failure.
 */
export function safeValidatePlatformOutput(data: unknown) {
    return PlatformOutputSchema.safeParse(data)
}
