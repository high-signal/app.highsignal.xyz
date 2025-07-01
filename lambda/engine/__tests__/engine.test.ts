import { describe, it, expect, beforeEach, vi, Mocked, MockedFunction } from "vitest"
import { runEngine } from "../src/engine"
import { getAppConfig, AppConfig, getDiscourseAdapterRuntimeConfig, DiscourseAdapterRuntimeConfig } from "../src/config"
import { Logger, initializeLogger } from "../src/logger"
import * as dbClient from "../src/dbClient"
import { AIOrchestrator } from "../src/aiOrchestrator"
import { DiscourseAdapter } from "../../discourse/src/adapter"

// Mock full modules
vi.mock("../src/config")
vi.mock("../src/logger")
vi.mock("../src/dbClient")
vi.mock("../src/aiOrchestrator")
vi.mock("../../discourse/src/adapter")

describe("runEngine", () => {
    // --- Mocks and Mock Data ---
    let mockGetAppConfig: MockedFunction<typeof getAppConfig>
    let mockGetDiscourseAdapterRuntimeConfig: MockedFunction<typeof getDiscourseAdapterRuntimeConfig>
    let mockInitializeLogger: MockedFunction<typeof initializeLogger>
    let mockGetSupabaseClient: MockedFunction<typeof dbClient.getSupabaseClient>
    let mockLoggerInstance: Mocked<Logger>
    let mockDiscourseAdapterInstance: Mocked<DiscourseAdapter>

    const testConfig: AppConfig = {
        NODE_ENV: "test",
        LOG_LEVEL: "info",
        SUPABASE_URL: "test-url",
        SUPABASE_SERVICE_ROLE_KEY: "test-key",
        OPENAI_API_KEY: "test-openai-key",
        ENABLE_USER_CENTRIC_WORKFLOW: true,
    }

    const testDiscourseConfig: DiscourseAdapterRuntimeConfig = {
        API_URL: "discourse-url",
        API_KEY: "discourse-key",
        PROJECT_ID: 123,
        SIGNAL_STRENGTH_ID: 1,
        MAX_VALUE: 100,
        aiConfig: {
            signalStrengthId: 1,
            model: "test-model",
            temperature: 0.5,
            maxChars: 1000,
            prompts: [],
            maxValue: 100,
        },
    }

    // --- Test Setup ---
    beforeEach(() => {
        vi.clearAllMocks()

        // Mock functions from modules
        mockGetAppConfig = vi.mocked(getAppConfig).mockResolvedValue(testConfig)
        mockGetDiscourseAdapterRuntimeConfig = vi
            .mocked(getDiscourseAdapterRuntimeConfig)
            .mockResolvedValue(testDiscourseConfig)
        mockGetSupabaseClient = vi.mocked(dbClient.getSupabaseClient)

        // Mock logger
        mockLoggerInstance = {
            info: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn(),
            child: vi.fn().mockReturnThis(),
        } as any
        mockInitializeLogger = vi.mocked(initializeLogger).mockReturnValue(mockLoggerInstance)

        // Mock DiscourseAdapter instance and its methods
        mockDiscourseAdapterInstance = new (vi.mocked(DiscourseAdapter))(
            mockLoggerInstance,
            new (vi.mocked(AIOrchestrator))(testConfig, mockLoggerInstance),
            testDiscourseConfig,
        ) as Mocked<DiscourseAdapter>

        vi.mocked(DiscourseAdapter).mockImplementation(() => mockDiscourseAdapterInstance)
    })

    // --- Test Cases ---
    it("should successfully run the user-centric workflow for Discourse", async () => {
        const options = { userId: "user-123", projectId: 123 }
        mockDiscourseAdapterInstance.processUser.mockResolvedValue(undefined)

        await runEngine("discourse", options)

        expect(mockDiscourseAdapterInstance.processUser).toHaveBeenCalledWith(
            options.userId,
            options.projectId,
            testDiscourseConfig.aiConfig,
        )
        expect(mockLoggerInstance.info).toHaveBeenCalledWith(
            `Successfully completed engine run for platform 'discourse' and user '${options.userId}'.`,
        )
        expect(mockLoggerInstance.error).not.toHaveBeenCalled()
    })

    it("should throw an error for an unsupported platform", async () => {
        const options = { userId: "user-123", projectId: 123 }
        const platform = "github"

        await expect(runEngine(platform, options)).rejects.toThrow(
            `Platform '${platform}' is not supported. This engine is currently configured for Discourse.`,
        )
    })

    it("should throw an error if userId is missing", async () => {
        const options = { projectId: 123 } // Missing userId
        await expect(runEngine("discourse", options as any)).rejects.toThrow(
            "userId and projectId are required in the event payload for the user-centric workflow.",
        )
    })

    it("should throw an error if projectId is missing", async () => {
        const options = { userId: "user-123" } // Missing projectId
        await expect(runEngine("discourse", options as any)).rejects.toThrow(
            "userId and projectId are required in the event payload for the user-centric workflow.",
        )
    })

    it("should catch and log errors from the adapter", async () => {
        const options = { userId: "user-123", projectId: 123 }
        const adapterError = new Error("Adapter processing failed!")
        mockDiscourseAdapterInstance.processUser.mockRejectedValue(adapterError)

        await expect(runEngine("discourse", options)).rejects.toThrow(adapterError)

        expect(mockLoggerInstance.error).toHaveBeenCalledWith(
            `Critical error during Lambda Engine run for platform 'discourse'.`,
            {
                errorMessage: adapterError.message,
                stack: adapterError.stack,
            },
        )
    })
})
