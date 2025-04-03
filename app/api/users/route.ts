import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { calculateSignal } from "../../../utils/calculateSignal"

type UserScore = {
    user_id: string
    score: number
    projects: {
        id: string
    }
}

type PeakSignal = {
    name: string
    image_src: string
    image_alt: string
    value: number
    project_id: string
}

type UserPeakSignal = {
    peak_signal_id: string
    peak_signals: PeakSignal
}

type User = {
    id: string
    username: string
    display_name: string
    profile_image_url: string
    user_peak_signals: UserPeakSignal[]
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get("project")
    const username = searchParams.get("user")

    if (!projectSlug) {
        return NextResponse.json({ error: "Project slug is required" }, { status: 400 })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    try {
        // First get the user project scores
        let projectScoresQuery = supabase
            .from("user_project_scores")
            .select(
                `
                user_id,
                score,
                projects!inner (
                    id
                ),
                users!inner (
                    username
                )
            `,
            )
            .eq("projects.url_slug", projectSlug)
            .order("score", { ascending: false })
            .limit(10)

        // If username is provided, filter by username
        if (username) {
            projectScoresQuery = projectScoresQuery.eq("users.username", username)
        }

        const { data: userScores, error: scoresError } = await projectScoresQuery

        if (scoresError) {
            console.error("scoresError", scoresError)
            return NextResponse.json({ error: "Error fetching user scores" }, { status: 500 })
        }

        if (!userScores || userScores.length === 0) {
            return NextResponse.json([])
        }

        // Then get the user details and peak signals for these users
        const userIds = userScores.map((score) => score.user_id)
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
                        image_src,
                        image_alt,
                        value,
                        project_id
                    )
                )
            `,
            )
            .in("id", userIds)

        const { data: users, error: usersError } = await userDetailsQuery

        if (usersError) {
            console.error("usersError", usersError)
            return NextResponse.json({ error: "Error fetching users" }, { status: 500 })
        }

        // Combine the data
        const formattedUsers = (userScores as unknown as UserScore[]).map((score) => {
            const user = (users as unknown as User[])?.find((u) => u.id === score.user_id)
            return {
                userId: score.user_id,
                score: score.score,
                username: user?.username || "",
                displayName: user?.display_name || "",
                profileImageUrl: user?.profile_image_url || "",
                signal: calculateSignal(score.score),
                peakSignals:
                    user?.user_peak_signals?.map((ups) => ({
                        name: ups.peak_signals.name,
                        imageSrc: ups.peak_signals.image_src,
                        imageAlt: ups.peak_signals.image_alt,
                        value: ups.peak_signals.value,
                        projectId: ups.peak_signals.project_id,
                    })) || [],
            }
        })

        return NextResponse.json(formattedUsers)
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
