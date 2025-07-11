import { describe, it, expect, beforeEach, vi, Mocked, MockedFunction } from "vitest"
import { runEngine } from "../src/engine"
import { getAppConfig, AppConfig, getAdapterRuntimeConfig } from "../src/config"
import { Logger, initializeLogger } from "../src/logger"
import { getSupabaseClient } from "@shared/dbClient"
import { AIOrchestrator } from "../src/aiOrchestrator"

// Mock full modules
vi.mock("../src/config")
vi.mock("../src/logger")
vi.mock("@shared/dbClient")
vi.mock("../src/aiOrchestrator")

// Mock the dynamic import for the adapter to break the circular dependency
const mockProcessUser = vi.fn()
const MockDiscourseAdapter = vi.fn(() => ({
    processUser: mockProcessUser,
}))

// Vitest intercepts the dynamic import call for '@discourse/adapter'
// and provides our mock implementation instead.
vi.mock("@discourse/adapter", () => {
    return {
        DiscourseAdapter: MockDiscourseAdapter,
    }
})

describe("runEngine", () => {
    // --- Mocks and Mock Data ---
    let mockGetAppConfig: MockedFunction<typeof getAppConfig>
    let mockGetAdapterRuntimeConfig: MockedFunction<typeof getAdapterRuntimeConfig>
    let mockInitializeLogger: MockedFunction<typeof initializeLogger>
    let mockGetSupabaseClient: MockedFunction<typeof getSupabaseClient>
    let mockLoggerInstance: Mocked<Logger>

    const testConfig: AppConfig = {
        NODE_ENV: "test",
        LOG_LEVEL: "info",
        SUPABASE_URL: "test-url",
        SUPABASE_SERVICE_ROLE_KEY: "test-key",
        OPENAI_API_KEY: "test-openai-key",
        ENABLE_USER_CENTRIC_WORKFLOW: true,
    }

    const testDiscourseConfig = {
        DISCOURSE_API_KEY: "discourse-key",
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
        // Reset mocks before each test
        vi.clearAllMocks()
        mockProcessUser.mockClear()
        MockDiscourseAdapter.mockClear()

        // Mock functions from modules
        mockGetAppConfig = vi.mocked(getAppConfig).mockResolvedValue(testConfig)
        mockGetAdapterRuntimeConfig = vi.mocked(getAdapterRuntimeConfig).mockResolvedValue(testDiscourseConfig as any)
        mockGetSupabaseClient = vi.mocked(getSupabaseClient)

        // Mock logger
        mockLoggerInstance = {
            info: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn(),
            child: vi.fn().mockReturnThis(),
        } as any
        mockInitializeLogger = vi.mocked(initializeLogger).mockReturnValue(mockLoggerInstance)
    })

    // --- Test Cases ---
    it("should successfully run the user-centric workflow for Discourse", async () => {
        const options = { userId: "user-123", projectId: 123 }
        mockProcessUser.mockResolvedValue(undefined)

        await runEngine("discourse", options)

        // Verify dynamic import and adapter instantiation
        expect(MockDiscourseAdapter).toHaveBeenCalledTimes(1)
        expect(MockDiscourseAdapter).toHaveBeenCalledWith(
            mockLoggerInstance,
            mockGetSupabaseClient(),
            expect.any(AIOrchestrator),
            testDiscourseConfig,
        )

        // Verify the main logic was called
        expect(mockProcessUser).toHaveBeenCalledWith(options.userId, options.projectId)
        expect(mockLoggerInstance.info).toHaveBeenCalledWith(
            `Successfully completed engine run for platform 'discourse' and user '${options.userId}'.`,
        )
        expect(mockLoggerInstance.error).not.toHaveBeenCalled()
    })

    it("should throw an error for an unsupported platform", async () => {
        const options = { userId: "user-123", projectId: 123 }
        const platform = "github"

        // Since we haven't mocked '@github/adapter', the dynamic import will fail,
        // which is the expected behavior for an unsupported platform.
        await expect(runEngine(platform, options)).rejects.toThrow()
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
        mockProcessUser.mockRejectedValue(adapterError)

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
