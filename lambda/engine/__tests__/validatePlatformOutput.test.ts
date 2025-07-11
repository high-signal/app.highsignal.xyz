import { describe, it, expect } from "vitest"
import { validatePlatformOutput, safeValidatePlatformOutput } from "../src/validatePlatformOutput"
import { PlatformOutput } from "../src/types"

// A valid mock object that conforms to the PlatformOutput schema
const validMockOutput: PlatformOutput = {
    topic_id: 12345,
    author: "testUser",
    content: "This is a valid post.",
    timestamp: "2023-10-27T10:00:00Z",
    reply_count: 10,
    like_count: 25,
    tags: ["tech", "testing"],
    metadata: { platform: "discourse" },
}

describe("PlatformOutput Validator", () => {
    describe("validatePlatformOutput (throwing validator)", () => {
        it("should successfully validate a correct PlatformOutput object", () => {
            // Expect no error to be thrown for a valid object
            expect(() => validatePlatformOutput(validMockOutput)).not.toThrow()
        })

        it("should successfully validate with a string topic_id", () => {
            const validWithStringId = { ...validMockOutput, topic_id: "abc-123" }
            expect(() => validatePlatformOutput(validWithStringId)).not.toThrow()
        })

        it("should successfully validate without optional metadata", () => {
            const { metadata, ...validWithoutMetadata } = validMockOutput
            expect(() => validatePlatformOutput(validWithoutMetadata)).not.toThrow()
        })

        it("should throw an error if topic_id is missing", () => {
            const { topic_id, ...invalid } = validMockOutput
            expect(() => validatePlatformOutput(invalid)).toThrow("topic_id is required")
        })

        it("should throw an error for an invalid timestamp format", () => {
            const invalid = { ...validMockOutput, timestamp: "not-a-date" }
            expect(() => validatePlatformOutput(invalid)).toThrow("timestamp must be a valid ISO 8601 date string")
        })

        it("should throw an error for a negative like_count", () => {
            const invalid = { ...validMockOutput, like_count: -1 }
            expect(() => validatePlatformOutput(invalid)).toThrow("like_count must be a non-negative integer")
        })

        it("should throw an error if tags is not an array of strings", () => {
            const invalid = { ...validMockOutput, tags: [123] } // Array of numbers
            expect(() => validatePlatformOutput(invalid)).toThrow("Expected string, received number")
        })
    })

    describe("safeValidatePlatformOutput (non-throwing validator)", () => {
        it("should return a success result for a correct PlatformOutput object", () => {
            const result = safeValidatePlatformOutput(validMockOutput)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data).toEqual(validMockOutput)
            }
        })

        it("should return an error result for an object with missing required fields", () => {
            const { author, ...invalid } = validMockOutput
            const result = safeValidatePlatformOutput(invalid)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].message).toBe("author is required")
            }
        })

        it("should return an error result for an object with incorrect data types", () => {
            const invalid = { ...validMockOutput, reply_count: "many" } // string instead of number
            const result = safeValidatePlatformOutput(invalid)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].message).toBe("Expected number, received string")
            }
        })
    })
})
