import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { calculateSignal } from "../../../utils/calculateSignal"

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
    user_signal_strengths: Array<{
        signal_strength_id: string
        project_id: string
        value: number
        summary: string
        description: string
        improvements: string
        signal_strengths: {
            id: string
            name: string
        }
    }>
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get("project")
    const username = searchParams.get("user")
    const fuzzy = searchParams.get("fuzzy") === "true"

    // Pagination
    const page = parseInt(searchParams.get("page") || "1")
    const resultsPerPage = 10
    const rankOffset = (page - 1) * resultsPerPage
    const from = rankOffset
    const to = from + resultsPerPage - 1

    if (!projectSlug) {
        return NextResponse.json({ error: "Project slug is required" }, { status: 400 })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    try {
        // Create the initial query to get the user project scores
        let projectScoresQuery = supabase
            .from("user_project_scores_ranked")
            .select(
                `
                    user_id,
                    score,
                    rank,
                    projects!inner (
                        id,
                        url_slug
                    ),
                    users!inner (
                        username,
                        display_name
                    )
                `,
            )
            .eq("projects.url_slug", projectSlug)
            .order("rank", { ascending: true })
            .range(from, to)

        // If username is provided, add username filter to the query
        if (username) {
            if (fuzzy) {
                // Use ILIKE for fuzzy matching on display_name only
                projectScoresQuery = projectScoresQuery.ilike("users.display_name", `%${username}%`)
            } else {
                // Use exact match for username
                projectScoresQuery = projectScoresQuery.eq("users.username", username)
            }
        }

        // Execute the query
        const { data: userProjectScores, error: scoresError } = await projectScoresQuery

        // If there is an error, return it
        if (scoresError) {
            console.error("scoresError", scoresError)
            return NextResponse.json({ error: "Error fetching user scores" }, { status: 500 })
        }

        // If there are no user scores, return an empty array
        if (!userProjectScores || userProjectScores.length === 0) {
            return NextResponse.json([])
        }

        // Then get the user details for the returned users
        const userIds = userProjectScores.map((score) => score.user_id)
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
                ),
                user_signal_strengths (
                    signal_strength_id,
                    project_id,
                    value,
                    summary,
                    description,
                    improvements,
                    signal_strengths!inner (
                        id,
                        name
                    )
                )
            `,
            )
            .in("id", userIds)

        // Execute the query
        const { data: userDetails, error: usersError } = await userDetailsQuery

        // If there is an error, return it
        if (usersError) {
            console.error("usersError", usersError)
            return NextResponse.json({ error: "Error fetching users" }, { status: 500 })
        }

        // Combine the data
        const formattedUsers = userProjectScores.map((score, index) => {
            const user = (userDetails as unknown as User[])?.find((u) => u.id === score.user_id)
            return {
                username: user?.username || "",
                displayName: user?.display_name || "",
                profileImageUrl: user?.profile_image_url || "",
                rank: score.rank,
                score: score.score,
                signal: calculateSignal(score.score),
                peakSignals:
                    user?.user_peak_signals?.map((ups) => ({
                        name: ups.peak_signals.name,
                        displayName: ups.peak_signals.display_name,
                        imageSrc: ups.peak_signals.image_src,
                        imageAlt: ups.peak_signals.image_alt,
                        value: ups.peak_signals.value,
                    })) || [],
                signalStrengths:
                    user?.user_signal_strengths?.map((uss) => {
                        return {
                            name: uss.signal_strengths.name,
                            value: uss.value,
                            summary: uss.summary,
                            description: uss.description,
                            improvements: uss.improvements,
                        }
                    }) || [],
            }
        })

        return NextResponse.json(formattedUsers)
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
