import { vi, describe, it, expect, beforeEach, afterEach, Mock } from "vitest"
import {
    getSupabaseClient,
    _resetSupabaseClient_TEST_ONLY,
    saveScore,
    getRawScoresForUser,
    getSignalStrengthConfig,
} from "../src/dbClient"
import { getAppConfig, _resetConfigCache_TEST_ONLY } from "../src/config"
import { UserSignalStrength } from "../src/types"

// Mock dependencies
vi.mock("../src/config")
vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => mockSupabaseClient),
}))

const mockGetAppConfig = getAppConfig as Mock

const mockSupabaseClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
    single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    delete: vi.fn().mockReturnThis(),
    match: vi.fn().mockResolvedValue({ error: null }),
}

describe("dbClient", () => {
    beforeEach(() => {
        _resetConfigCache_TEST_ONLY()
        _resetSupabaseClient_TEST_ONLY()
        mockGetAppConfig.mockResolvedValue({
            SUPABASE_URL: "http://mock-supabase.url",
            SUPABASE_SERVICE_ROLE_KEY: "mock-supabase-key",
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("saveScore", () => {
        it("should call delete and insert with the correct data", async () => {
            const scoreData: Omit<UserSignalStrength, "id" | "created_at" | "test_requesting_user"> = {
                user_id: 1,
                project_id: 1,
                signal_strength_id: 1,
                day: "2023-01-01",
                value: 100,
                raw_value: null,
                max_value: 100,
                summary: "Test summary",
                description: "Test description",
                improvements: "Test improvements",
                explained_reasoning: "Test reasoning",
                created: 1234567890,
            }

            await saveScore(scoreData)

            // Verify delete call
            expect(mockSupabaseClient.from).toHaveBeenCalledWith("user_signal_strengths")
            expect(mockSupabaseClient.delete).toHaveBeenCalled()
            expect(mockSupabaseClient.match).toHaveBeenCalledWith({
                user_id: scoreData.user_id,
                project_id: scoreData.project_id,
                signal_strength_id: scoreData.signal_strength_id,
                day: scoreData.day,
            })

            // Verify insert call
            expect(mockSupabaseClient.from).toHaveBeenCalledWith("user_signal_strengths")
            expect(mockSupabaseClient.insert).toHaveBeenCalledWith(scoreData)
        })

        it("should throw an error if delete fails", async () => {
            const dbError = new Error("DB delete failed")
            mockSupabaseClient.match.mockResolvedValueOnce({ error: dbError })

            const scoreData = { user_id: 1, project_id: 1, signal_strength_id: 1, day: "2023-01-01" } as any
            await expect(saveScore(scoreData)).rejects.toThrow(`Failed to clear previous score: ${dbError.message}`)
        })

        it("should throw an error if insert fails", async () => {
            const dbError = new Error("DB insert failed")
            // Mock delete to succeed
            mockSupabaseClient.match.mockResolvedValueOnce({ error: null })
            // Mock insert to fail
            mockSupabaseClient.insert.mockResolvedValueOnce({ error: dbError })

            const scoreData = { user_id: 1, project_id: 1, signal_strength_id: 1, day: "2023-01-01" } as any
            await expect(saveScore(scoreData)).rejects.toThrow(`Failed to save score: ${dbError.message}`)
        })
    })

    describe("getSignalStrengthConfig", () => {
        it("should fetch previous_days from project_signal_strengths", async () => {
            const expectedConfig = { previous_days: 45 }
            mockSupabaseClient.single.mockResolvedValueOnce({ data: expectedConfig, error: null })

            const result = await getSignalStrengthConfig(1, 1)

            expect(mockSupabaseClient.from).toHaveBeenCalledWith("project_signal_strengths")
            expect(mockSupabaseClient.select).toHaveBeenCalledWith("previous_days")
            expect(mockSupabaseClient.eq).toHaveBeenCalledWith("signal_strength_id", 1)
            expect(mockSupabaseClient.eq).toHaveBeenCalledWith("project_id", 1)
            expect(result).toEqual(expectedConfig)
        })

        it("should return null if no config is found", async () => {
            mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } })
            const result = await getSignalStrengthConfig(1, 1)
            expect(result).toBeNull()
        })
    })

    describe("getRawScoresForUser", () => {
        it("should use dynamic lookback period from getSignalStrengthConfig", async () => {
            const lookbackDays = 15
            // Mock getSignalStrengthConfig's underlying DB call
            mockSupabaseClient.single.mockResolvedValueOnce({ data: { previous_days: lookbackDays }, error: null })
            // Mock getRawScoresForUser's DB call
            mockSupabaseClient.order.mockResolvedValueOnce({ data: [], error: null })

            await getRawScoresForUser(1, 1, 1)

            const expectedDate = new Date()
            expectedDate.setDate(expectedDate.getDate() - lookbackDays)
            const expectedDateString = expectedDate.toISOString().split("T")[0]

            expect(mockSupabaseClient.gte).toHaveBeenCalledWith("day", expectedDateString)
        })

        it("should use default 30-day lookback if config is not found", async () => {
            const defaultLookbackDays = 30
            // Mock getSignalStrengthConfig's underlying DB call to return null
            mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } })
            // Mock getRawScoresForUser's DB call
            mockSupabaseClient.order.mockResolvedValueOnce({ data: [], error: null })

            await getRawScoresForUser(1, 1, 1)

            const expectedDate = new Date()
            expectedDate.setDate(expectedDate.getDate() - defaultLookbackDays)
            const expectedDateString = expectedDate.toISOString().split("T")[0]

            expect(mockSupabaseClient.gte).toHaveBeenCalledWith("day", expectedDateString)
        })

        it("should throw an error if fetching scores fails", async () => {
            const dbError = new Error("DB select failed")
            mockSupabaseClient.single.mockResolvedValueOnce({ data: { previous_days: 30 }, error: null })
            mockSupabaseClient.order.mockResolvedValueOnce({ error: dbError })

            await expect(getRawScoresForUser(1, 1, 1)).rejects.toThrow(dbError)
        })
    })
})
