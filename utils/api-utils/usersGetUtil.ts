import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { calculateSignalFromScore } from "../../utils/calculateSignal"

import { APP_CONFIG } from "../../config/constants"

type User = {
    id: string
    username: string
    display_name: string
    profile_image_url: string
    user_peak_signals: Array<{
        peak_signal_id: string
        peak_signals: {
            name: string
            display_name: string
            image_src: string
            image_alt: string
            value: number
            project_id: string
        }
    }>
}

type SignalStrength = {
    signal_strengths: {
        id: string
        name: string
    }
    last_checked: number
    value: number
    summary: string
    description: string
    improvements: string
    // *** Super Admin only start ***
    request_id: string
    created: number
    user_id: string
    project_id: string
    signal_strength_id: string
    explained_reasoning?: string
    prompt_tokens?: number
    completion_tokens?: number
    logs?: string
    model?: string
    temperature?: number
    prompt?: string
    max_chars?: number
    // *** Super Admin only end ***
}

export async function getUsers(request: Request, isSuperAdminRequesting: boolean = false) {
    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get("project")
    const username = searchParams.get("user")
    const fuzzy = searchParams.get("fuzzy") === "true"
    const showTestDataOnly = searchParams.get("showTestDataOnly") === "true" || false

    // Pagination
    const page = parseInt(searchParams.get("page") || "1")
    const resultsPerPage = APP_CONFIG.DEFAULT_PAGINATION_LIMIT
    const from = (page - 1) * resultsPerPage
    const to = from + resultsPerPage - 1

    if (!projectSlug) {
        return NextResponse.json({ error: "Project slug is required" }, { status: 400 })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    try {
        let projectScoresQuery = supabase
            .from("user_project_scores")
            .select(
                `
                    user_id,
                    username,
                    display_name,
                    project_id,
                    rank,
                    total_score,
                    projects!project_signal_strengths_project_id_fkey!inner (
                        id,
                        url_slug
                    )
                `,
            )
            .eq("projects.url_slug", projectSlug)
            .order("rank", { ascending: true })
            .range(from, to)

        // Filter by username or display name if provided
        if (username) {
            if (fuzzy) {
                projectScoresQuery = projectScoresQuery.ilike("display_name", `%${username}%`)
            } else {
                projectScoresQuery = projectScoresQuery.eq("username", username)
            }
        }

        const { data: userProjectScores, error: scoresError } = await projectScoresQuery

        if (scoresError) {
            console.error("scoresError", scoresError)
            return NextResponse.json({ error: "Error fetching user scores" }, { status: 500 })
        }

        if (!userProjectScores || userProjectScores.length === 0) {
            return NextResponse.json([])
        }

        const userIds = userProjectScores.map((score) => score.user_id)

        // Get user details
        let userDetailsQuery = supabase
            .from("users")
            .select(
                `
                    id,
                    username,
                    display_name,
                    profile_image_url,
                    user_peak_signals (
                    peak_signal_id,
                    peak_signals!inner (
                        name,
                        display_name,
                        image_src,
                        image_alt,
                        value,
                        project_id
                    )
                    )
                `,
            )
            .in("id", userIds)

        const { data: userDetails, error: usersError } = await userDetailsQuery

        if (usersError) {
            console.error("usersError", usersError)
            return NextResponse.json({ error: "Error fetching users" }, { status: 500 })
        }

        // Get all available signal strengths
        const { data: signalStrengthIds, error: signalStrengthIdsError } = await supabase
            .from("signal_strengths")
            .select("id")

        if (signalStrengthIdsError) {
            console.error("signalStrengthIdsError", signalStrengthIdsError)
            return NextResponse.json({ error: "Error fetching signal strength ids" }, { status: 500 })
        }

        const signalStrengthIdValues = signalStrengthIds?.map((item) => item.id) || []

        // Get signal strengths
        const signalStrengthsResults = await Promise.all(
            // For each user
            userIds.map(async (userId) => {
                const signalData = await Promise.all(
                    // For each signal strength
                    signalStrengthIdValues.map(async (signalStrengthId) => {
                        let query = supabase
                            .from("user_signal_strengths")
                            .select(
                                `
                                signal_strengths!inner (
                                    id,
                                    name
                                ),
                                *
                                `,
                            )
                            .eq("user_id", userId)
                            .eq("project_id", userProjectScores[0]?.project_id)
                            .eq("signal_strength_id", signalStrengthId)

                        if (showTestDataOnly) {
                            query = query.not("test_requesting_user", "is", null)
                        } else {
                            query = query.is("test_requesting_user", null)
                        }

                        const { data, error } = await query.order("created", { ascending: false }).limit(1)

                        if (error) {
                            console.error("signalStrengthsError", error)
                            return null
                        }

                        return data?.[0] || null
                    }),
                )

                return signalData.filter(Boolean)
            }),

            // TODO: Add historical data here.
            // For each user, get just the scores and "created" values for each signal strength,
            // then return that as an object array to be used as the full history of signal strengths for that user
            // It should just be one query to get all the data
            // I can add a limit e.g. past 100 days
            // [ {created: 1715222400, value: 55}, {created: 1715136000, value: 40}, ... ]
        )

        const signalStrengths = signalStrengthsResults.flat()

        if (!signalStrengths) {
            return NextResponse.json({ error: "Error fetching signal strengths" }, { status: 500 })
        }

        const formattedUsers = userProjectScores
            .map((score) => {
                const user = (userDetails as unknown as User[])?.find((u) => u.id === score.user_id)
                if (!user) return null

                const userSignalStrengths = signalStrengths?.filter((ss) => ss.user_id === user.id) || []

                return {
                    id: user.id,
                    username: user.username,
                    displayName: user.display_name,
                    profileImageUrl: user.profile_image_url,
                    rank: score.rank,
                    score: score.total_score,
                    signal: calculateSignalFromScore(score.total_score),
                    peakSignals:
                        user.user_peak_signals?.map((ups) => ({
                            name: ups.peak_signals.name,
                            displayName: ups.peak_signals.display_name,
                            imageSrc: ups.peak_signals.image_src,
                            imageAlt: ups.peak_signals.image_alt,
                            value: ups.peak_signals.value,
                        })) || [],
                    signalStrengths: userSignalStrengths.map((uss) => ({
                        name: uss.signal_strengths.name,
                        ...(uss.last_checked ? { lastChecked: uss.last_checked } : {}),
                        value: uss.value,
                        summary: uss.summary,
                        description: uss.description,
                        improvements: uss.improvements,
                        // TODO: history: uss.history
                        ...(isSuperAdminRequesting
                            ? {
                                  requestId: uss.request_id,
                                  created: uss.created,
                                  user_id: uss.user_id,
                                  project_id: uss.project_id,
                                  signal_strength_id: uss.signal_strength_id,
                                  explainedReasoning: uss.explained_reasoning,
                                  model: uss.model,
                                  prompt: uss.prompt,
                                  temperature: uss.temperature,
                                  maxChars: uss.max_chars,
                                  logs: uss.logs,
                                  promptTokens: uss.prompt_tokens,
                                  completionTokens: uss.completion_tokens,
                              }
                            : {}),
                    })),
                }
            })
            .filter(Boolean) // Remove nulls if any usernames didn't match filter

        return NextResponse.json(formattedUsers)
    } catch (error) {
        console.error("Unhandled error", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
