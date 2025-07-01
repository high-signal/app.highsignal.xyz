import { describe, it, expect, vi, beforeEach } from "vitest"
import { AIOrchestrator } from "../src/aiOrchestrator"
import { AppConfig } from "../src/config"
import { Logger } from "../src/logger"
import * as dbClient from "../src/dbClient"
import * as aiService from "../src/aiService"
import type { AiConfig, PlatformOutput, AIScoreOutput, ForumUser, UserSignalStrength } from "../src/types"

// Mock dependencies
vi.mock("../src/dbClient")
vi.mock("../src/aiService")

const mockLogger: Logger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
} as any

const mockAppConfig = {} as AppConfig

describe("AIOrchestrator", () => {
    const mockAiConfig: AiConfig = {
        signalStrengthId: 1,
        model: "gpt-4-test",
        temperature: 0.7,
        maxChars: 1000,
        maxValue: 10,
        prompts: [
            {
                id: 1,
                ai_config_id: 1,
                type: "raw",
                prompt: "OLD RAW - Analyze: ${content} for ${username} (${displayName}). Max score: ${maxValue}",
                created_at: "2023-01-01T12:00:00.000Z",
            },
            {
                id: 2,
                ai_config_id: 1,
                type: "smart",
                prompt: "OLD SMART - Summarize: ${content} for ${username}. Max score: ${maxValue}",
                created_at: "2023-01-01T12:00:00.000Z",
            },
            {
                id: 3,
                ai_config_id: 1,
                type: "raw",
                prompt: "Analyze: ${content} for ${username} (${displayName}). Max score: ${maxValue}",
                created_at: "2023-01-02T12:00:00.000Z", // Newer
            },
            {
                id: 4,
                ai_config_id: 1,
                type: "smart",
                prompt: "Summarize: ${content} for ${username}. Max score: ${maxValue}",
                created_at: "2023-01-02T12:00:00.000Z", // Newer
            },
        ],
    }

    const mockPlatformOutputs: PlatformOutput[] = [
        {
            topic_id: 1,
            author: "101",
            content: "Post 1",
            timestamp: new Date().toISOString(),
            reply_count: 0,
            like_count: 2,
            tags: [],
        },
        {
            topic_id: 2,
            author: "102",
            content: "Post 2",
            timestamp: new Date().toISOString(),
            reply_count: 1,
            like_count: 3,
            tags: [],
        },
        {
            topic_id: 3,
            author: "101",
            content: "Post 3",
            timestamp: new Date().toISOString(),
            reply_count: 2,
            like_count: 5,
            tags: [],
        },
    ]

    const mockUsersData = new Map([
        [101, { user_id: 101, username: "user1", displayName: "User One" }],
        [102, { user_id: 102, username: "user2", displayName: "User Two" }],
    ])

    const mockAiScoreOutput: AIScoreOutput = {
        value: 8,
        summary: "Good contributions",
        description: "Detailed analysis",
        improvements: "Could be more concise",
        explained_reasoning: "Based on content analysis",
        modelUsed: "gpt-4-test",
        requestId: "req-123",
        promptTokens: 100,
        completionTokens: 50,
    }

    const mockAIServiceClient = {
        getStructuredResponse: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dbClient.getAiConfig).mockResolvedValue(mockAiConfig)
        vi.mocked(dbClient.getUsersByIds).mockResolvedValue(mockUsersData as any)
        vi.mocked(aiService.getAIServiceClient).mockReturnValue(mockAIServiceClient)
        mockAIServiceClient.getStructuredResponse.mockResolvedValue(mockAiScoreOutput)
    })

    describe("getAiScores", () => {
        it("should process platform outputs and return user signal strengths", async () => {
            const orchestrator = new AIOrchestrator(mockAppConfig, mockLogger)
            const result = await orchestrator.getAiScores(mockPlatformOutputs, "2023-01-01", 1, 1)

            expect(result).toHaveLength(2)
            expect(result[0].user_id).toBe(101)
            expect(result[0].value).toBe(8)
            expect(result[0].summary).toBe("Good contributions")
            expect(dbClient.getAiConfig).toHaveBeenCalledWith(1, 1)
            expect(dbClient.getUsersByIds).toHaveBeenCalledWith([101, 102])
            expect(aiService.getAIServiceClient).toHaveBeenCalledTimes(2)
            expect(mockAIServiceClient.getStructuredResponse).toHaveBeenCalledTimes(2)
        })

        it("should return an empty array if AI config is not found", async () => {
            vi.mocked(dbClient.getAiConfig).mockResolvedValue(null)
            const orchestrator = new AIOrchestrator(mockAppConfig, mockLogger)
            const result = await orchestrator.getAiScores(mockPlatformOutputs, "2023-01-01", 1, 1)

            expect(result).toEqual([])
            expect(mockLogger.error).toHaveBeenCalledWith(
                "AIOrchestrator: Could not obtain valid AI config or prompt. Aborting.",
                expect.any(Object),
            )
        })
    })

    describe("generateRawScoreForUserActivity", () => {
        const mockUser: ForumUser = { user_id: 101, forum_username: "user1" }

        it("should generate a raw score for a user", async () => {
            const orchestrator = new AIOrchestrator(mockAppConfig, mockLogger)
            const result = await orchestrator.generateRawScoreForUserActivity("User activity summary", mockUser, 1, 1)

            expect(result).toEqual({ score: mockAiScoreOutput, promptId: 3 });
            expect(mockAIServiceClient.getStructuredResponse).toHaveBeenCalledWith(
                "Analyze: User activity summary for user1 (User One). Max score: 10",
                expect.any(Object),
            )
        })
    })

    describe("generateSmartScoreFromRawScores", () => {
        const mockUser: ForumUser = { user_id: 101, forum_username: "user1" }
        const rawScores: Pick<UserSignalStrength, "day" | "value" | "summary">[] = [
            { day: "2023-01-01", value: 7, summary: "First day summary" },
            { day: "2023-01-02", value: 9, summary: "Second day summary" },
        ]

        it("should generate a smart score from raw scores", async () => {
            const orchestrator = new AIOrchestrator(mockAppConfig, mockLogger)
            await orchestrator.generateSmartScoreFromRawScores(rawScores, mockUser, 1, 1)

            const expectedPrompt = `Summarize: The following are raw scores for user1:\n- On 2023-01-01, score was 7/10. Summary: First day summary\n- On 2023-01-02, score was 9/10. Summary: Second day summary. Max score: 10`
            // We use stringContaining because the exact whitespace might vary slightly.
            expect(mockAIServiceClient.getStructuredResponse).toHaveBeenCalledWith(
                expect.stringContaining("Summarize: The following are raw scores for user1:"),
                expect.any(Object),
            )
            expect(mockAIServiceClient.getStructuredResponse).toHaveBeenCalledWith(
                expect.stringContaining("- On 2023-01-01, score was 7/10. Summary: First day summary"),
                expect.any(Object),
            )
        })

        it("should return null if no raw scores are provided", async () => {
            const orchestrator = new AIOrchestrator(mockAppConfig, mockLogger)
            const result = await orchestrator.generateSmartScoreFromRawScores([], mockUser, 1, 1)

            expect(result).toBeNull()
            expect(mockLogger.warn).toHaveBeenCalledWith("No raw scores provided; cannot generate smart score.")
        })
    })
})
