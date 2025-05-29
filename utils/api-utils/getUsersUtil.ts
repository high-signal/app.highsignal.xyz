import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { calculateSignalFromScore } from "../calculateSignal"

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

type SignalStrengthData = {
    signal_strengths: {
        name: string
    }
    id?: number
    day: string
    last_checked?: number
    value: number
    max_value: number
    summary: string
    description: string
    improvements: string
    // *** Super Admin only start ***
    request_id?: string
    created?: number
    user_id?: string
    project_id?: string
    signal_strength_id?: string
    explained_reasoning?: string
    model?: string
    prompt_id?: string
    prompts?: {
        prompt: string
    }
    temperature?: number
    max_chars?: number
    logs?: string
    prompt_tokens?: number
    completion_tokens?: number
    raw_value?: number
    test_requesting_user?: string
    // *** Super Admin only end ***
}

type SignalStrengthGroup = {
    signalStrengthId: string
    data: SignalStrengthData[]
}

export async function getUsersUtil(request: Request, isSuperAdminRequesting: boolean = false) {
    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get("project")
    const username = searchParams.get("user")
    const fuzzy = searchParams.get("fuzzy") === "true"
    const showTestDataOnly = searchParams.get("showTestDataOnly") === "true" || false
    const showRawScoreCalcOnly = searchParams.get("showRawScoreCalcOnly") === "true" || false

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

        // If superadmin is requesting, get all connected accounts for the user
        let connectedAccounts = []
        if (isSuperAdminRequesting) {
            // Get forum users
            const { data: forumUsers, error: forumUsersError } = await supabase
                .from("forum_users")
                .select("user_id, project_id, forum_username")
                .in("user_id", userIds)

            if (forumUsersError) {
                console.error("forumUsersError", forumUsersError)
                return NextResponse.json({ error: "Error fetching forum users" }, { status: 500 })
            }

            connectedAccounts.push({
                name: "discourse_forum",
                data: forumUsers.map((user) => ({
                    userId: user.user_id,
                    projectId: user.project_id,
                    forumUsername: user.forum_username,
                })),
            })
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
                                id,
                                signal_strengths!inner (
                                    name
                                ),
                                prompts (
                                    prompt
                                ),
                                *
                                `,
                            )
                            .eq("user_id", userId)
                            .eq("project_id", userProjectScores[0]?.project_id)
                            .eq("signal_strength_id", signalStrengthId)

                        // Filter test data
                        if (isSuperAdminRequesting && showTestDataOnly) {
                            query = query.not("test_requesting_user", "is", null)
                        } else {
                            query = query.is("test_requesting_user", null)
                        }

                        // Filter raw score calc
                        if (isSuperAdminRequesting && showRawScoreCalcOnly) {
                            query = query.not("raw_value", "is", null)
                        } else {
                            query = query.is("raw_value", null)
                        }

                        // TODO: Make this dynamic based on the previous_days value for the signal strength for the project
                        const { data, error } = await query.order("day", { ascending: false }).limit(90)

                        if (error) {
                            console.error("signalStrengthsError", error)
                            return null
                        }

                        return {
                            signalStrengthId,
                            data: data as SignalStrengthData[],
                        }
                    }),
                )

                return signalData.filter(Boolean) as SignalStrengthGroup[]
            }),
        )

        const signalStrengths = signalStrengthsResults.flat()

        if (!signalStrengths) {
            return NextResponse.json({ error: "Error fetching signal strengths" }, { status: 500 })
        }

        const formattedUsers = userProjectScores
            .map((score) => {
                const user = (userDetails as unknown as User[])?.find((u) => u.id === score.user_id)
                if (!user) return null

                const userSignalStrengths = signalStrengths?.filter((ss) => ss?.data[0]?.user_id === user.id) || []

                return {
                    id: user.id,
                    username: user.username,
                    displayName: user.display_name,
                    profileImageUrl: user.profile_image_url,
                    rank: score.rank,
                    score: score.total_score,
                    signal: calculateSignalFromScore(score.total_score),
                    ...(isSuperAdminRequesting
                        ? {
                              connectedAccounts: connectedAccounts.map((account) => ({
                                  name: account.name,
                                  data: account.data
                                      .filter((item) => item.userId === user.id)
                                      .map(({ userId, ...rest }) => rest),
                              })),
                          }
                        : {}),
                    signalStrengths: userSignalStrengths.map((uss) => ({
                        signalStrengthName: uss.data[0]?.signal_strengths?.name || uss.signalStrengthId,
                        data: uss.data.map((d, index) => ({
                            ...(d.last_checked ? { lastChecked: d.last_checked } : {}),
                            // These are always available to the user for every result for historical charts
                            day: d.day,
                            value: d.value,
                            maxValue: d.max_value,
                            // Only show details for the latest result to the user
                            ...(isSuperAdminRequesting || index === 0
                                ? {
                                      summary: d.summary,
                                      description: d.description,
                                      improvements: d.improvements,
                                  }
                                : {}),
                            ...(isSuperAdminRequesting
                                ? {
                                      id: d.id,
                                      requestId: d.request_id,
                                      created: d.created,
                                      user_id: d.user_id,
                                      project_id: d.project_id,
                                      signal_strength_id: d.signal_strength_id,
                                      explainedReasoning: d.explained_reasoning,
                                      model: d.model,
                                      promptId: d.prompt_id,
                                      prompt: d.prompts?.prompt,
                                      temperature: d.temperature,
                                      maxChars: d.max_chars,
                                      logs: d.logs,
                                      promptTokens: d.prompt_tokens,
                                      completionTokens: d.completion_tokens,
                                      rawValue: d.raw_value,
                                      testRequestingUser: d.test_requesting_user,
                                  }
                                : {}),
                        })),
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
