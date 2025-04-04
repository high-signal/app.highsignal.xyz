import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { calculateSignal } from "../../../utils/calculateSignal"

type UserProjectScore = {
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

type SignalStrength = {
    id: string
    name: string
    display_name: string
    project_signal_strengths: Array<{
        max_value: number
        enabled: boolean
        display_order_index: number
    }>
}

type ProjectSignalStrength = {
    signal_strength_id: string
    project_id: string
    enabled: boolean
    display_order_index: number
    max_value: number
}

type UserSignalStrength = {
    signal_strength_id: string
    project_id: string
    value: number
    summary: string
    description: string
    signal_strengths: SignalStrength
    project_signal_strengths: {
        max_value: number
        enabled: boolean
        display_order_index: number
    }
}

type User = {
    id: string
    username: string
    display_name: string
    profile_image_url: string
    user_peak_signals: UserPeakSignal[]
    user_signal_strengths: UserSignalStrength[]
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
        // Create the initial query to get the user project scores
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

        // If username is provided, add username filter to the query
        if (username) {
            projectScoresQuery = projectScoresQuery.eq("users.username", username)
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
                    signal_strengths!inner (
                        id,
                        name,
                        display_name,
                        project_signal_strengths!inner (
                            max_value,
                            enabled,
                            display_order_index
                        )
                    )
                )
            `,
            )
            .in("id", userIds)

        // Execute the query
        const { data: users, error: usersError } = await userDetailsQuery

        // If there is an error, return it
        if (usersError) {
            console.error("usersError", usersError)
            return NextResponse.json({ error: "Error fetching users" }, { status: 500 })
        }

        // Combine the data
        const formattedUsers = (userProjectScores as unknown as UserProjectScore[]).map((score) => {
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
                signalStrengths:
                    user?.user_signal_strengths?.map((uss) => {
                        // Get the first project signal strength or use default values
                        const projectSignalStrength = uss.signal_strengths.project_signal_strengths?.[0] || {
                            max_value: 0,
                            enabled: false,
                            display_order_index: 0,
                        }

                        return {
                            name: uss.signal_strengths.name,
                            displayName: uss.signal_strengths.display_name,
                            value: uss.value,
                            summary: uss.summary,
                            description: uss.description,
                            projectId: uss.project_id,
                            maxValue: projectSignalStrength.max_value,
                            enabled: projectSignalStrength.enabled,
                            displayOrderIndex: projectSignalStrength.display_order_index,
                        }
                    }) || [],
            }
        })

        return NextResponse.json(formattedUsers)
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
