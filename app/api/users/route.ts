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
                    project_id,
                    rank,
                    total_score,
                    signal_strength_score,
                    peak_signal_score,
                    projects!project_signal_strengths_project_id_fkey!inner (
                        id,
                        url_slug
                    )
                `,
            )
            .eq("projects.url_slug", projectSlug)
            .order("rank", { ascending: true })
            .range(from, to)

        const { data: userProjectScores, error: scoresError } = await projectScoresQuery

        if (scoresError) {
            console.error("scoresError", scoresError)
            return NextResponse.json({ error: "Error fetching user scores" }, { status: 500 })
        }

        if (!userProjectScores || userProjectScores.length === 0) {
            return NextResponse.json([])
        }

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

        if (username) {
            if (fuzzy) {
                userDetailsQuery = userDetailsQuery.ilike("display_name", `%${username}%`)
            } else {
                userDetailsQuery = userDetailsQuery.eq("username", username)
            }
        }

        const { data: userDetails, error: usersError } = await userDetailsQuery

        if (usersError) {
            console.error("usersError", usersError)
            return NextResponse.json({ error: "Error fetching users" }, { status: 500 })
        }

        const formattedUsers = userProjectScores
            .map((score) => {
                const user = (userDetails as unknown as User[])?.find((u) => u.id === score.user_id)
                if (!user) return null
                return {
                    username: user.username,
                    displayName: user.display_name,
                    profileImageUrl: user.profile_image_url,
                    rank: score.rank,
                    score: score.total_score,
                    signalStrengthScore: score.signal_strength_score,
                    peakSignalScore: score.peak_signal_score,
                    signal: calculateSignal(score.total_score),
                    peakSignals:
                        user.user_peak_signals?.map((ups) => ({
                            name: ups.peak_signals.name,
                            displayName: ups.peak_signals.display_name,
                            imageSrc: ups.peak_signals.image_src,
                            imageAlt: ups.peak_signals.image_alt,
                            value: ups.peak_signals.value,
                        })) || [],
                    signalStrengths:
                        user.user_signal_strengths?.map((uss) => ({
                            name: uss.signal_strengths.name,
                            value: uss.value,
                            summary: uss.summary,
                            description: uss.description,
                            improvements: uss.improvements,
                        })) || [],
                }
            })
            .filter(Boolean) // Remove nulls if any usernames didn’t match filter

        return NextResponse.json(formattedUsers)
    } catch (error) {
        console.error("Unhandled error", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
