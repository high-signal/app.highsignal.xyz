import { describe, it, expect, vi, beforeEach } from "vitest"
import OpenAI from "openai"
import { getAIServiceClient } from "../src/aiService"
import { AppConfig } from "../src/config"
import { AiConfig, ModelConfig } from "../src/types"
import { Logger } from "../src/logger"

// Mock the entire openai library
vi.mock("openai")

// Create a simple, typed mock object for the logger.
// This avoids complex module mocking and respects the dependency injection pattern.
const mockLogger: Logger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
} as any // Use 'as any' to avoid needing to implement all of Winston's methods.

describe("aiService", () => {
    let mockCreate: any // Use 'any' to avoid namespace issues with vi.Mock

    beforeEach(() => {
        // vi.clearAllMocks() resets the call history of all mocks, which is sufficient
        // for ensuring test isolation in this context.
        vi.clearAllMocks()

        mockCreate = vi.fn()
        // @ts-ignore - Mocking the implementation of the OpenAI client
        OpenAI.mockImplementation(() => ({
            chat: {
                completions: {
                    create: mockCreate,
                },
            },
        }))
    })

    const appConfig = { OPENAI_API_KEY: "test-key" } as AppConfig
    const aiDbConfig = { model: "gpt-4" } as AiConfig
    const modelConfig: ModelConfig = {
        model: "gpt-4-test",
        temperature: 0.5,
    }

    const mockValidResponse = {
        id: "chatcmpl-123",
        model: "gpt-4-test",
        choices: [
            {
                message: {
                    role: "assistant",
                    content: JSON.stringify({
                        value: 10,
                        summary: "Great summary",
                        description: "Detailed description",
                        improvements: "Some improvements",
                        explained_reasoning: "Clear reasoning",
                    }),
                },
            },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 20 },
    }

    it("should return a structured response for a valid flat JSON payload", async () => {
        mockCreate.mockResolvedValue(mockValidResponse)

        const client = getAIServiceClient(appConfig, aiDbConfig, mockLogger)
        const response = await client.getStructuredResponse("test prompt", modelConfig)

        expect(response.value).toBe(10)
        expect(response.summary).toBe("Great summary")
        expect(response.modelUsed).toBe("gpt-4-test")
        expect(mockLogger.error).not.toHaveBeenCalled()
    })

    it("should handle a valid nested JSON payload", async () => {
        const nestedResponse = { ...mockValidResponse }
        nestedResponse.choices[0].message.content = JSON.stringify({
            testuser: {
                value: 8,
                summary: "Nested summary",
                description: "Nested description",
                improvements: "Nested improvements",
                explained_reasoning: "Nested reasoning",
            },
        })
        mockCreate.mockResolvedValue(nestedResponse)

        const client = getAIServiceClient(appConfig, aiDbConfig, mockLogger)
        const response = await client.getStructuredResponse("test prompt", modelConfig)

        expect(response.value).toBe(8)
        expect(response.summary).toBe("Nested summary")
        expect(mockLogger.error).not.toHaveBeenCalled()
    })

    it("should throw an error for malformed JSON", async () => {
        const malformedResponse = { ...mockValidResponse }
        malformedResponse.choices[0].message.content = "this is not json"
        mockCreate.mockResolvedValue(malformedResponse)

        const client = getAIServiceClient(appConfig, aiDbConfig, mockLogger)

        await expect(client.getStructuredResponse("test prompt", modelConfig)).rejects.toThrow(
            "Failed to parse OpenAI JSON response",
        )
        expect(mockLogger.error).toHaveBeenCalledWith(
            "[AISERVICE] Failed to parse OpenAI JSON response.",
            expect.any(Object),
        )
    })

    it("should throw a validation error for missing fields", async () => {
        const invalidResponse = { ...mockValidResponse }
        invalidResponse.choices[0].message.content = JSON.stringify({
            value: 5,
            // summary is missing
            description: "description here",
            improvements: "improvements here",
            explained_reasoning: "reasoning here",
        })
        mockCreate.mockResolvedValue(invalidResponse)

        const client = getAIServiceClient(appConfig, aiDbConfig, mockLogger)

        await expect(client.getStructuredResponse("test prompt", modelConfig)).rejects.toThrow(
            "OpenAI response validation failed",
        )
        expect(mockLogger.error).toHaveBeenCalledWith(
            "[AISERVICE] OpenAI response failed Zod validation.",
            expect.any(Object),
        )
    })

    it("should throw an error if response content is null", async () => {
        const nullContentResponse = { ...mockValidResponse }
        // @ts-ignore - Intentionally setting content to null to test error handling
        nullContentResponse.choices[0].message.content = null
        mockCreate.mockResolvedValue(nullContentResponse)

        const client = getAIServiceClient(appConfig, aiDbConfig, mockLogger)

        await expect(client.getStructuredResponse("test prompt", modelConfig)).rejects.toThrow(
            "OpenAI response content is empty",
        )
        expect(mockLogger.error).toHaveBeenCalledWith("[AISERVICE] OpenAI response content is empty.")
    })

    it("should throw an error if the API key is missing", () => {
        const badAppConfig = {} as AppConfig // No API key
        expect(() => getAIServiceClient(badAppConfig, aiDbConfig, mockLogger)).toThrow(
            "OpenAI API key is not configured in application config.",
        )
        expect(mockLogger.error).toHaveBeenCalledWith("[AISERVICE] OpenAI API key is not configured in appConfig.")
    })

    it("should handle snake_case and camelCase for explained_reasoning", async () => {
        const camelCaseResponse = { ...mockValidResponse }
        camelCaseResponse.choices[0].message.content = JSON.stringify({
            value: 10,
            summary: "Great summary",
            description: "Detailed description",
            improvements: "Some improvements",
            explainedReasoning: "Camel case reasoning",
        })
        mockCreate.mockResolvedValue(camelCaseResponse)

        const client = getAIServiceClient(appConfig, aiDbConfig, mockLogger)
        const response = await client.getStructuredResponse("test prompt", modelConfig)

        expect(response.explained_reasoning).toBe("Camel case reasoning")
        expect(mockLogger.error).not.toHaveBeenCalled()
    })
})
