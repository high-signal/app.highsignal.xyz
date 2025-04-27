import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { calculateSignalFromScore } from "../../../utils/calculateSignal"

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
        last_checked: number
        signal_strengths: {
            id: string
            name: string
        }
    }>
}

// Unauthenticated GET request
// Returns user data for a given project
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
                    last_checked,
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
                    id: user.id,
                    username: user.username,
                    displayName: user.display_name,
                    profileImageUrl: user.profile_image_url,
                    rank: score.rank,
                    score: score.total_score,
                    signalStrengthScore: score.signal_strength_score,
                    peakSignalScore: score.peak_signal_score,
                    signal: calculateSignalFromScore(score.total_score),
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
                            lastChecked: uss.last_checked,
                        })) || [],
                }
            })
            .filter(Boolean) // Remove nulls if any usernames didn't match filter

        return NextResponse.json(formattedUsers)
    } catch (error) {
        console.error("Unhandled error", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// Authenticated POST request (uses logged in user privyId)
// Creates a new user in the database
// Takes no arguments as it creates a default user in the database
// Note: This is a special API where it only requires a logged in user, so remains on this API route
export async function POST(request: Request) {
    try {
        // Get the privyId of the logged in user from the headers (set by middleware)
        const privyId = request.headers.get("x-privy-id")!

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Check if privy_id already exists
        const { data: existingPrivyUser, error: privyCheckError } = await supabase
            .from("users")
            .select("id")
            .eq("privy_id", privyId)
            .single()

        if (privyCheckError && privyCheckError.code !== "PGRST116") {
            console.error("Error checking privy_id:", privyCheckError)
            return NextResponse.json({ error: "Error checking privy_id" }, { status: 500 })
        }

        if (existingPrivyUser) {
            return NextResponse.json({ error: "User already exists with this Privy ID" }, { status: 409 })
        }

        // Function to generate a random 6-digit number (excluding 0)
        function generateRandomNumber(): number {
            // Generate a random number between 100000 and 999999
            return Math.floor(Math.random() * 900000) + 100000
        }

        // Function to check if a username exists in the database
        async function usernameExists(supabase: any, username: string): Promise<boolean> {
            const { data, error } = await supabase.from("users").select("id").eq("username", username).single()

            // If error is PGRST116 (no rows returned), the username doesn't exist
            if (error && error.code === "PGRST116") {
                return false
            }

            // If there's another error or data exists, the username exists
            return true
        }

        // Function to generate a unique username with retries
        async function generateUniqueUsername(supabase: any, maxAttempts = 3): Promise<string | null> {
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const username = `user_${generateRandomNumber()}`
                const exists = await usernameExists(supabase, username)

                if (!exists) {
                    return username
                }
            }

            return null // All attempts failed
        }

        // Generate a unique username
        const username = await generateUniqueUsername(supabase)

        if (!username) {
            return NextResponse.json(
                { error: "Failed to generate a unique username after multiple attempts" },
                { status: 500 },
            )
        }

        // Create display name from username (e.g., "User 849124")
        const displayName = `User ${username.split("_")[1]}`

        // Create new user
        const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert([
                {
                    privy_id: privyId,
                    username: username,
                    display_name: displayName,
                },
            ])
            .select()
            .single()

        if (insertError) {
            console.error("Error creating user:", insertError)
            return NextResponse.json({ error: "Error creating user" }, { status: 500 })
        }

        return NextResponse.json(newUser, { status: 201 })
    } catch (error) {
        console.error("Unhandled error in user creation:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
