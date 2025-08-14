import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Simplified user data API endpoint
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get("project")
    const searchType = searchParams.get("searchType")
    const searchValue = searchParams.get("searchValue")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const apiKey = searchParams.get("apiKey")

    const MAX_DAYS_TO_FETCH = 360

    if (!projectSlug) {
        return NextResponse.json({ error: "Project is required" }, { status: 400 })
    }

    if (!searchType || !searchValue) {
        return NextResponse.json({ error: "Both searchType and searchValue are required" }, { status: 400 })
    }

    if (
        searchType !== "highSignalUsername" &&
        searchType !== "address" &&
        searchType !== "email" &&
        searchType !== "discordUsername" &&
        searchType !== "xUsername" &&
        searchType !== "farcasterUsername"
    ) {
        return NextResponse.json(
            {
                error: "searchType must be either 'highSignalUsername', 'address', 'email', 'discordUsername', 'xUsername', or 'farcasterUsername'",
            },
            { status: 400 },
        )
    }

    // Validate startDate format if provided
    if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        return NextResponse.json({ error: "startDate must be in YYYY-MM-DD format" }, { status: 400 })
    }

    // Validate endDate format if provided
    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return NextResponse.json({ error: "endDate must be in YYYY-MM-DD format" }, { status: 400 })
    }

    // Check that searchValue is not greater than 255 characters
    if (searchValue && searchValue.length > 255) {
        return NextResponse.json({ error: "searchValue must be less than 255 characters" }, { status: 400 })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    try {
        let apiKeyProjectSlug: string | null = null

        // =============================
        // Validate API key if provided
        // =============================
        if (apiKey) {
            const { data: apiKeyData, error: apiKeyError } = await supabase
                .from("projects")
                .select("url_slug")
                .eq("api_key", apiKey)
                .single()

            if (apiKeyError && apiKeyError.code !== "PGRST116") {
                return NextResponse.json({ error: "Error fetching project" }, { status: 500 })
            }

            if (!apiKeyData) {
                return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
            } else {
                if (apiKeyData.url_slug !== projectSlug) {
                    return NextResponse.json({ error: "The API key used is for a different project" }, { status: 401 })
                } else {
                    apiKeyProjectSlug = apiKeyData.url_slug
                }
            }
        }

        // ===============================
        // Find user based on search type
        // ===============================
        let userProjectScore: any = null
        let scoresError: any = null

        if (searchType === "highSignalUsername") {
            // Search by username
            const { data, error } = await supabase
                .from("user_project_scores")
                .select(
                    `
                    user_id,
                    username,
                    display_name,
                    project_id,
                    total_score,
                    projects!project_signal_strengths_project_id_fkey!inner (
                        id,
                        url_slug
                    )
                `,
                )
                .eq("projects.url_slug", projectSlug)
                .eq("username", searchValue)
                .single()

            userProjectScore = data
            scoresError = error
        } else if (searchType === "address") {
            // Search by address - first find the user_id from user_addresses
            // We need to check both public addresses and shared addresses separately
            let foundUserId: string | null = null

            // First, try to find public addresses (always accessible)
            const { data: publicAddressData, error: publicAddressError } = await supabase
                .from("user_addresses")
                .select("user_id")
                .eq("address", searchValue)
                .eq("is_public", true)
                .single()

            if (publicAddressData) {
                foundUserId = publicAddressData.user_id
            } else if (publicAddressError && publicAddressError.code !== "PGRST116") {
                console.error("publicAddressError", publicAddressError)
                return NextResponse.json({ error: "Error fetching address" }, { status: 500 })
            }

            // If not found in public addresses, check shared addresses (only if API key is provided)
            if (!foundUserId) {
                if (!apiKeyProjectSlug) {
                    return NextResponse.json(
                        {
                            error: `Address '${searchValue}' not found or not accessible. API key required for shared addresses.`,
                        },
                        { status: 404 },
                    )
                }

                const { data: sharedAddressData, error: sharedAddressError } = await supabase
                    .from("user_addresses")
                    .select(
                        `
                        user_id,
                        user_addresses_shared!inner(
                            projects!inner(
                                url_slug
                            )
                        )
                    `,
                    )
                    .eq("address", searchValue)
                    .eq("user_addresses_shared.projects.url_slug", projectSlug)
                    .single()

                if (sharedAddressData) {
                    foundUserId = sharedAddressData.user_id
                } else if (sharedAddressError && sharedAddressError.code !== "PGRST116") {
                    console.error("sharedAddressError", sharedAddressError)
                    return NextResponse.json({ error: "Error fetching address" }, { status: 500 })
                }
            }

            if (!foundUserId) {
                return NextResponse.json({ error: `Address '${searchValue}' not found` }, { status: 404 })
            }

            // Now get the user project score using the found user_id
            const { data, error } = await supabase
                .from("user_project_scores")
                .select(
                    `
                    user_id,
                    username,
                    display_name,
                    project_id,
                    total_score,
                    projects!project_signal_strengths_project_id_fkey!inner (
                        id,
                        url_slug
                    )
                `,
                )
                .eq("projects.url_slug", projectSlug)
                .eq("user_id", foundUserId)
                .single()

            userProjectScore = data
            scoresError = error
        } else if (
            searchType === "email" ||
            searchType === "discordUsername" ||
            searchType === "xUsername" ||
            searchType === "farcasterUsername"
        ) {
            // TODO: Implement search by email, discord username, x username, or farcaster username
            return NextResponse.json({ error: "Not yet implemented" }, { status: 501 })
        }

        if (scoresError) {
            if (scoresError.code === "PGRST116") {
                return NextResponse.json({ error: `User '${searchValue}' not found` }, { status: 404 })
            }
            console.error("scoresError", scoresError)
            return NextResponse.json({ error: "Error fetching user score" }, { status: 500 })
        }

        // ============================
        // Get historical total scores
        // ============================
        let historicalScoresQuery = supabase
            .from("user_project_scores_history")
            .select("total_score, day")
            .eq("user_id", userProjectScore.user_id)
            .eq("project_id", userProjectScore.project_id)

        // Apply date filtering
        if (startDate && endDate && startDate !== endDate) {
            // Date range: get all dates between start and end (inclusive)
            historicalScoresQuery = historicalScoresQuery.gte("day", startDate).lte("day", endDate)
        } else if (startDate) {
            // Single date: get only the start date
            historicalScoresQuery = historicalScoresQuery.eq("day", startDate)
        }

        const { data: historicalTotalScores, error: historicalTotalScoresError } = await historicalScoresQuery
            .order("day", { ascending: false })
            .limit(MAX_DAYS_TO_FETCH)

        if (historicalTotalScoresError) {
            console.error("historicalTotalScoresError", historicalTotalScoresError)
            return NextResponse.json({ error: "Error fetching historical total scores" }, { status: 500 })
        }

        // =====================
        // Get signal strengths
        // =====================
        const { data: signalStrengthIds, error: signalStrengthIdsError } = await supabase
            .from("signal_strengths")
            .select("id")

        if (signalStrengthIdsError) {
            console.error("signalStrengthIdsError", signalStrengthIdsError)
            return NextResponse.json({ error: "Error fetching signal strength ids" }, { status: 500 })
        }

        const signalStrengthIdValues = signalStrengthIds?.map((item) => item.id) || []

        // Get signal strengths data
        const signalStrengthsResults = await Promise.all(
            signalStrengthIdValues.map(async (signalStrengthId) => {
                let query = supabase
                    .from("user_signal_strengths")
                    .select(
                        `
                        signal_strengths!inner (
                            name
                        ),
                        day,
                        value,
                        max_value,
                        previous_days
                    `,
                    )
                    .eq("user_id", userProjectScore.user_id)
                    .eq("project_id", userProjectScore.project_id)
                    .eq("signal_strength_id", signalStrengthId)
                    .is("test_requesting_user", null)
                    .is("raw_value", null)

                // Apply date filtering
                if (startDate && endDate && startDate !== endDate) {
                    // Date range: get all dates between start and end (inclusive)
                    query = query.gte("day", startDate).lte("day", endDate)
                } else if (startDate) {
                    // Single date: get only the start date
                    query = query.eq("day", startDate)
                }

                const { data, error } = await query.order("day", { ascending: false }).limit(MAX_DAYS_TO_FETCH)

                if (error) {
                    console.error("signalStrengthsError", error)
                    return null
                }

                return {
                    signalStrengthId,
                    data: data || [],
                }
            }),
        )

        const signalStrengths = signalStrengthsResults.filter(Boolean)

        // ==============
        // Get addresses
        // ==============
        let addresses: string[] = []

        // Get public addresses (always visible)
        const { data: publicAddresses, error: publicAddressesError } = await supabase
            .from("user_addresses")
            .select(
                `
                address,
                users!inner(
                    username
                )
            `,
            )
            .eq("users.username", userProjectScore.username)
            .eq("is_public", true)

        if (publicAddressesError) {
            console.error("publicAddressesError", publicAddressesError)
        } else {
            addresses.push(...(publicAddresses?.map((addr) => addr.address) || []))
        }

        // Get addresses that the user has shared with the selected project if API key is provided
        if (apiKeyProjectSlug) {
            const { data: sharedAddresses, error: sharedAddressesError } = await supabase
                .from("user_addresses")
                .select(
                    `
                    address,
                    user_addresses_shared!inner(
                        projects!inner(
                            url_slug
                        )
                    ),
                    users!inner(
                        username
                    )
                `,
                )
                .eq("users.username", userProjectScore.username)
                .eq("user_addresses_shared.projects.url_slug", projectSlug)

            if (sharedAddressesError) {
                console.error("sharedAddressesError", sharedAddressesError)
            } else {
                addresses.push(...(sharedAddresses?.map((addr) => addr.address) || []))
            }
        }

        // ===================
        // Get other accounts
        // ===================
        // TODO: First get public accounts

        // TODO: Get accounts that the user has shared with the selected project if API key is provided

        // Format the response
        const response = {
            username: userProjectScore.username,
            displayName: userProjectScore.display_name,
            ...(addresses.length > 0 ? { addresses } : {}),
            totalScores:
                historicalTotalScores?.map((score) => ({
                    day: score.day,
                    totalScore: score.total_score,
                })) || [],
            signalStrengths: signalStrengths
                .filter((ss): ss is NonNullable<typeof ss> => ss !== null)
                .filter((ss) => ss.data.length > 0) // Only include signal strengths that have data
                .map((ss) => ({
                    signalStrengthName: (ss.data[0] as any)?.signal_strengths?.name || String(ss.signalStrengthId),
                    data: ss.data.map((d: any) => ({
                        day: d.day,
                        value: d.value,
                        maxValue: d.max_value,
                        scoreCalculationPeriodPreviousDays: d.previous_days,
                    })),
                })),
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error("Unhandled error", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
