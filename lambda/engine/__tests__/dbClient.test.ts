import { vi, describe, it, expect, beforeEach } from "vitest"
import { saveScore, getRawScoresForUser, getLegacySignalConfig } from "../../shared/src/db"
import { UserSignalStrength } from "../../shared/src/types"
import { SupabaseClient } from "@supabase/supabase-js"

// Mock getLegacySignalConfig since it's a dependency of getRawScoresForUser
// and we want to test them in isolation.
vi.mock("../../shared/src/db", async (importOriginal) => {
    const original = await importOriginal<typeof import("../../shared/src/db")>()
    return {
        ...original,
        getLegacySignalConfig: vi.fn(),
    }
})

const mockQueryBuilder = {
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

const mockSupabaseClient = {
    from: vi.fn().mockReturnValue(mockQueryBuilder),
} as any as SupabaseClient

describe("shared/db.ts", () => {
    beforeEach(() => {
        vi.clearAllMocks()

        // Reset mocks on the query builder methods
        Object.values(mockQueryBuilder).forEach((mockFn) => {
            if (typeof mockFn.mockClear === "function") {
                mockFn.mockClear()
            }
        })

        // Reset the main client `from` mock
        vi.mocked(mockSupabaseClient.from).mockClear()

        // Restore default mock implementations for methods that don't return `this`
        mockQueryBuilder.insert.mockResolvedValue({ data: null, error: null })
        mockQueryBuilder.order.mockResolvedValue({ data: [], error: null })
        mockQueryBuilder.single.mockResolvedValue({ data: {}, error: null })
        mockQueryBuilder.match.mockResolvedValue({ error: null })
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

            await saveScore(mockSupabaseClient, scoreData)

            // Verify delete call
            expect(mockSupabaseClient.from).toHaveBeenCalledWith("user_signal_strengths")
            expect(mockQueryBuilder.delete).toHaveBeenCalled()
            expect(mockQueryBuilder.match).toHaveBeenCalledWith({
                user_id: scoreData.user_id,
                project_id: scoreData.project_id,
                signal_strength_id: scoreData.signal_strength_id,
                day: scoreData.day,
            })

            // Verify insert call
            expect(mockSupabaseClient.from).toHaveBeenCalledWith("user_signal_strengths")
            expect(mockQueryBuilder.insert).toHaveBeenCalledWith(scoreData)
        })

        it("should throw an error if delete fails", async () => {
            const dbError = new Error("DB delete failed")
            vi.mocked(mockQueryBuilder.match).mockResolvedValueOnce({ error: dbError })

            const scoreData = { user_id: 1, project_id: 1, signal_strength_id: 1, day: "2023-01-01" } as any
            await expect(saveScore(mockSupabaseClient, scoreData)).rejects.toThrow(
                `Failed to clear previous score: ${dbError.message}`,
            )
        })

        it("should throw an error if insert fails", async () => {
            const dbError = new Error("DB insert failed")
            vi.mocked(mockQueryBuilder.match).mockResolvedValueOnce({ error: null })
            vi.mocked(mockQueryBuilder.insert).mockResolvedValueOnce({ error: dbError })

            const scoreData = { user_id: 1, project_id: 1, signal_strength_id: 1, day: "2023-01-01" } as any
            await expect(saveScore(mockSupabaseClient, scoreData)).rejects.toThrow(
                `Failed to save score: ${dbError.message}`,
            )
        })
    })

    describe("getRawScoresForUser", () => {
        it("should use dynamic lookback period from getLegacySignalConfig", async () => {
            const lookbackDays = 15
            vi.mocked(getLegacySignalConfig).mockResolvedValueOnce({ lookback_days: lookbackDays } as any)
            vi.mocked(mockQueryBuilder.order).mockResolvedValueOnce({ data: [], error: null })

            await getRawScoresForUser(mockSupabaseClient, 1, 1, 1)

            const expectedDate = new Date()
            expectedDate.setDate(expectedDate.getDate() - lookbackDays)
            const expectedDateString = expectedDate.toISOString().split("T")[0]

            expect(mockQueryBuilder.gte).toHaveBeenCalledWith("day", expectedDateString)
        })

        it("should use default 30-day lookback if config is not found", async () => {
            const defaultLookbackDays = 30
            vi.mocked(getLegacySignalConfig).mockResolvedValueOnce(null)
            vi.mocked(mockQueryBuilder.order).mockResolvedValueOnce({ data: [], error: null })

            await getRawScoresForUser(mockSupabaseClient, 1, 1, 1)

            const expectedDate = new Date()
            expectedDate.setDate(expectedDate.getDate() - defaultLookbackDays)
            const expectedDateString = expectedDate.toISOString().split("T")[0]

            expect(mockQueryBuilder.gte).toHaveBeenCalledWith("day", expectedDateString)
        })

        it("should throw an error if fetching scores fails", async () => {
            const dbError = new Error("DB select failed")
            vi.mocked(getLegacySignalConfig).mockResolvedValueOnce({ lookback_days: 30 } as any)
            vi.mocked(mockQueryBuilder.order).mockResolvedValueOnce({ error: dbError })

            await expect(getRawScoresForUser(mockSupabaseClient, 1, 1, 1)).rejects.toThrow(dbError)
        })
    })
})
