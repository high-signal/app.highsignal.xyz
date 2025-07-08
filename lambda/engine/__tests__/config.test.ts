import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager"
import { mockClient } from "aws-sdk-client-mock"
import { AiConfig } from "../src/types"

// Mock the dbClient entirely to control AI config fetching
vi.mock("../src/dbClient", () => ({
    getLegacySignalConfig: vi.fn(),
}))

const smMock = mockClient(SecretsManagerClient)

describe("Lambda Engine Configuration", () => {
    let dbClientMocks: any
    let configModule: any

    beforeEach(async () => {
        // Reset mocks and modules before each test to ensure isolation
        vi.resetModules()
        smMock.reset()

        // Import the modules that will be used in the tests
        dbClientMocks = await import("../src/dbClient")
        configModule = await import("../src/config")

        // Reset the config cache before each test
        configModule._resetConfigCache_TEST_ONLY()
    })

    afterEach(() => {
        // Clean up all environment variable stubs
        vi.unstubAllEnvs()
    })

    describe("getAppConfig", () => {
        it("should load and validate config from process.env in local dev", async () => {
            vi.stubEnv("NODE_ENV", "development")
            vi.stubEnv("SUPABASE_URL", "http://localhost:54321")
            vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "local-supabase-key")
            vi.stubEnv("OPENAI_API_KEY", "local-openai-key")
            vi.stubEnv("ENABLE_USER_CENTRIC_WORKFLOW", "true")

            const config = await configModule.getAppConfig()

            expect(config.NODE_ENV).toBe("development")
            expect(config.SUPABASE_URL).toBe("http://localhost:54321")
            expect(config.OPENAI_API_KEY).toBe("local-openai-key")
            expect(config.ENABLE_USER_CENTRIC_WORKFLOW).toBe(true)
        })

        it("should load and validate config from Secrets Manager in production", async () => {
            vi.stubEnv("NODE_ENV", "production")

            smMock.on(GetSecretValueCommand, { SecretId: "highsignal/production/app" }).resolves({
                SecretString: JSON.stringify({
                    SUPABASE_URL: "https://prod.supabase.co",
                    SUPABASE_SERVICE_ROLE_KEY: "prod-supabase-key",
                    OPENAI_API_KEY: "prod-openai-key",
                }),
            })

            const config = await configModule.getAppConfig()

            expect(config.NODE_ENV).toBe("production")
            expect(config.SUPABASE_URL).toBe("https://prod.supabase.co")
            expect(config.OPENAI_API_KEY).toBe("prod-openai-key")

            const calls = smMock.commandCalls(GetSecretValueCommand)
            expect(calls).toHaveLength(1)
            expect(calls[0].args[0].input).toEqual({
                SecretId: "highsignal/production/app",
            })
        })

        it("should throw an error if required env vars are missing in local dev", async () => {
            vi.stubEnv("NODE_ENV", "development")
            // Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY

            await expect(configModule.getAppConfig()).rejects.toThrow(
                "[CONFIG] Invalid application configuration: SUPABASE_URL - Required, SUPABASE_SERVICE_ROLE_KEY - Required, OPENAI_API_KEY - Required",
            )
        })

        it("should prioritize env vars over Secrets Manager in production", async () => {
            vi.stubEnv("NODE_ENV", "production")
            vi.stubEnv("SUPABASE_URL", "env-var-supabase-url") // This should be used

            smMock.on(GetSecretValueCommand).resolves({
                SecretString: JSON.stringify({
                    SUPABASE_URL: "sm-supabase-url", // This should be ignored
                    SUPABASE_SERVICE_ROLE_KEY: "sm-supabase-key",
                    OPENAI_API_KEY: "sm-openai-key",
                }),
            })

            const config = await configModule.getAppConfig()

            expect(config.SUPABASE_URL).toBe("env-var-supabase-url")
            expect(config.SUPABASE_SERVICE_ROLE_KEY).toBe("sm-supabase-key")
            expect(smMock.commandCalls(GetSecretValueCommand).length).toBe(1)
        })
    })

    describe("getAdapterRuntimeConfig", () => {
        const mockAiConfig: AiConfig = {
            signalStrengthId: 10,
            model: "gpt-4",
            temperature: 0.7,
            maxChars: 5000,
            prompts: [],
            maxValue: 10,
            previous_days: 30,
        }

        beforeEach(() => {
            dbClientMocks.getLegacySignalConfig.mockResolvedValue(mockAiConfig)
        })

        it("should load Discourse config from process.env in local dev", async () => {
            vi.stubEnv("NODE_ENV", "development")
            vi.stubEnv("DISCOURSE_API_URL", "http://discourse.local")
            vi.stubEnv("DISCOURSE_API_KEY", "discourse-key-local")
            vi.stubEnv("DISCOURSE_PROJECT_ID", "1")
            vi.stubEnv("DISCOURSE_SIGNAL_STRENGTH_ID", "10")

            const config = await configModule.getDiscourseAdapterRuntimeConfig()


            expect(config.PROJECT_ID).toBe(1)
            expect(config.aiConfig).toEqual(mockAiConfig)
        })

        it("should load Discourse config from Secrets Manager in production", async () => {
            vi.stubEnv("NODE_ENV", "production")

            smMock.on(GetSecretValueCommand).resolves({
                SecretString: JSON.stringify({

                    API_KEY: "prod-discourse-key",
                    PROJECT_ID: 2,
                    SIGNAL_STRENGTH_ID: 20,
                }),
            })

            // We need to mock the AI config fetch for the production case as well
            const prodAiConfig = { ...mockAiConfig, signalStrengthId: 20 }
            dbClientMocks.getLegacySignalConfig.mockResolvedValue(prodAiConfig)

            const config = await configModule.getAdapterRuntimeConfig("discourse")


            expect(config.PROJECT_ID).toBe(2)
            expect(config.aiConfig.signalStrengthId).toBe(20)

            const calls = smMock.commandCalls(GetSecretValueCommand)
            expect(calls).toHaveLength(1)
            expect(calls[0].args[0].input).toEqual({
                SecretId: "highsignal/production/discourse",
            })
        })

        it("should throw an error if getLegacySignalConfig returns null", async () => {
            vi.stubEnv("NODE_ENV", "development")
            vi.stubEnv("DISCOURSE_API_URL", "http://discourse.local")
            vi.stubEnv("DISCOURSE_API_KEY", "discourse-key-local")
            vi.stubEnv("DISCOURSE_PROJECT_ID", "1")
            vi.stubEnv("DISCOURSE_SIGNAL_STRENGTH_ID", "10")

            dbClientMocks.getLegacySignalConfig.mockResolvedValue(null)

            await expect(configModule.getAdapterRuntimeConfig("discourse")).rejects.toThrow(
                "[CONFIG] Failed to fetch required AI configuration for signal strength ID: 10",
            )
        })

        it("should throw a specific error for invalid data types", async () => {
            vi.stubEnv("NODE_ENV", "development")
            vi.stubEnv("DISCOURSE_API_URL", "http://discourse.local")
            vi.stubEnv("DISCOURSE_API_KEY", "discourse-key-local")
            vi.stubEnv("DISCOURSE_PROJECT_ID", "not-a-number") // Invalid
            vi.stubEnv("DISCOURSE_SIGNAL_STRENGTH_ID", "10")

            await expect(configModule.getAdapterRuntimeConfig("discourse")).rejects.toThrow(
                "[CONFIG] Invalid Discourse adapter configuration: PROJECT_ID - Expected number, received nan",
            )
        })

        it("should prioritize Discourse env vars over Secrets Manager in production", async () => {
            vi.stubEnv("NODE_ENV", "production")


            smMock.on(GetSecretValueCommand).resolves({
                SecretString: JSON.stringify({

                    API_KEY: "sm-discourse-key",
                    PROJECT_ID: 99,
                    SIGNAL_STRENGTH_ID: 99,
                }),
            })

            dbClientMocks.getLegacySignalConfig.mockResolvedValue(mockAiConfig)

            const config = await configModule.getDiscourseAdapterRuntimeConfig()


            expect(config.DISCOURSE_API_KEY).toBe("sm-discourse-key")
            expect(smMock.commandCalls(GetSecretValueCommand).length).toBe(1)
        })
    })

    describe("_resetConfigCache_TEST_ONLY", () => {
        it("should throw an error if not in a test environment", () => {
            vi.stubEnv("NODE_ENV", "development")

            expect(() => configModule._resetConfigCache_TEST_ONLY()).toThrow(
                "[CONFIG] _resetConfigCache_TEST_ONLY() was called outside of a test environment. This is strictly forbidden.",
            )
        })

        it("should not throw an error when in the test environment", () => {
            vi.stubEnv("NODE_ENV", "test")

            expect(() => configModule._resetConfigCache_TEST_ONLY()).not.toThrow()
        })
    })
})
