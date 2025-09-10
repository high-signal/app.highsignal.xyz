import { createClient, SupabaseClient } from "@supabase/supabase-js"
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
    previous_days: number
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

export async function getUsersUtil(
    request: Request,
    isSuperAdminRequesting: boolean = false,
    isUserDataVisible: boolean = false,
) {
    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get("project")
    const username = searchParams.get("username")
    const fuzzy = searchParams.get("fuzzy") === "true" || false
    const showTestDataOnly = searchParams.get("showTestDataOnly") === "true" || false
    const showRawScoreCalcOnly = searchParams.get("showRawScoreCalcOnly") === "true" || false
    const apiKey = searchParams.get("apiKey")
    const testRequestingUser = searchParams.get("testRequestingUser")
    const leaderboardOnly = searchParams.get("leaderboardOnly") === "true" || false
    const pageSize = parseInt(searchParams.get("pageSize") || "0")

    // Pagination
    let resultsPerPage
    if (!pageSize) {
        resultsPerPage = APP_CONFIG.PAGINATION_LIMIT_DEFAULT
    } else {
        // Page size must be a number greater than or equal to APP_CONFIG.PAGINATION_LIMIT_DEFAULT and less than or equal to APP_CONFIG.PAGINATION_LIMIT_MAX
        // Else, set it to the default value
        if (pageSize < APP_CONFIG.PAGINATION_LIMIT_DEFAULT) {
            resultsPerPage = APP_CONFIG.PAGINATION_LIMIT_DEFAULT
        } else if (pageSize > APP_CONFIG.PAGINATION_LIMIT_MAX) {
            resultsPerPage = APP_CONFIG.PAGINATION_LIMIT_MAX
        } else {
            resultsPerPage = pageSize
        }
    }
    const page = parseInt(searchParams.get("page") || "1")
    const from = (page - 1) * resultsPerPage
    const to = from + resultsPerPage - 1

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    try {
        let apiKeyProjectSlug: string | null = null
        // If an API key is provided, check if it is valid
        if (apiKey) {
            // If no project slug is provided, return an error
            if (!projectSlug) {
                return NextResponse.json({ error: "Project is required to use an API key" }, { status: 400 })
            }

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
                    return NextResponse.json({ error: "That API key is for a different project" }, { status: 401 })
                } else {
                    // If the API key is valid, set the apiKeyProjectSlug
                    apiKeyProjectSlug = apiKeyData.url_slug
                }
            }
        }

        if (!projectSlug && (!username || fuzzy)) {
            return usersOnly(supabase, from, to, resultsPerPage, page, fuzzy, username || "")
        } else {
            let projectScoresQuery = supabase
                .from("user_project_scores")
                .select(
                    `
                    user_id,
                    username,
                    display_name,
                    profile_image_url,
                    project_id,
                    rank,
                    total_score,
                    projects!project_signal_strengths_project_id_fkey!inner (
                        id,
                        url_slug
                    )
                `,
                    { count: "exact" },
                )
                .range(from, to)
                .order("rank", { ascending: true })
                .order("display_name", { ascending: true })

            // Add project filter only if project slug is provided
            if (projectSlug) {
                projectScoresQuery = projectScoresQuery.eq("projects.url_slug", projectSlug)
            }

            // Filter by username or display name if provided
            if (username) {
                // Fuzzy search only if and project slug is provided
                if (fuzzy && projectSlug) {
                    projectScoresQuery = projectScoresQuery.or(
                        `display_name.ilike.%${username}%,username.ilike.%${username}%`,
                    )
                } else {
                    projectScoresQuery = projectScoresQuery.eq("username", username)
                }
            }

            const { data: userProjectScores, count, error: scoresError } = await projectScoresQuery

            const maxPage = Math.ceil((count || 0) / resultsPerPage)
            const maxPageResponse = await checkMaxPage(page, count || 0, resultsPerPage, maxPage)
            if (maxPageResponse instanceof NextResponse) return maxPageResponse

            if (scoresError) {
                console.error("scoresError", scoresError)
                return NextResponse.json({ error: "Error fetching user scores" }, { status: 500 })
            }

            if (!userProjectScores || userProjectScores.length === 0) {
                return NextResponse.json({ data: [], total: 0, page, resultsPerPage })
            }

            const userIds = userProjectScores.map((score) => score.user_id)

            // Calculate the date previousDaysMax base on the smart score max history
            const previousDaysMax = new Date()
            let smartScoreMaxHistory: number = APP_CONFIG.SMART_SCORE_MAX_HISTORY_PROJECT_RESULTS
            if (username && !fuzzy) {
                smartScoreMaxHistory = APP_CONFIG.SMART_SCORE_MAX_HISTORY_SINGLE_USER_RESULTS
            }
            previousDaysMax.setDate(previousDaysMax.getDate() - smartScoreMaxHistory)
            const previousDaysMaxString = previousDaysMax.toISOString().split("T")[0]

            // Get all historical total scores for the users
            let historicalTotalScores: { user_id: string; project_id: string; total_score: number; day: string }[] = []
            if (!leaderboardOnly) {
                // Use pagination to fetch all historical data for the full date range
                let allHistoricalData: { user_id: string; project_id: string; total_score: number; day: string }[] = []
                let hasMoreData = true
                let offset = 0
                const batchSize = 1000 // Fetch in batches of 1000 records
                let batchCount = 0

                while (hasMoreData) {
                    batchCount++
                    const { data: historicalTotalScoresData, error: historicalTotalScoresError } = await supabase
                        .from("user_project_scores_history")
                        .select("user_id, project_id, total_score, day")
                        .in("user_id", userIds)
                        .gte("day", previousDaysMaxString)
                        .order("day", { ascending: false })
                        .range(offset, offset + batchSize - 1)

                    if (historicalTotalScoresError) {
                        console.error("historicalTotalScoresError", historicalTotalScoresError)
                        return NextResponse.json({ error: "Error fetching historical total scores" }, { status: 500 })
                    }

                    if (!historicalTotalScoresData || historicalTotalScoresData.length === 0) {
                        hasMoreData = false
                    } else {
                        allHistoricalData = allHistoricalData.concat(historicalTotalScoresData)
                        offset += batchSize

                        // If we got fewer records than the batch size, we've reached the end
                        if (historicalTotalScoresData.length < batchSize) {
                            hasMoreData = false
                        }
                    }
                }

                historicalTotalScores = allHistoricalData
            }

            // If superadmin is requesting, get all connected accounts for the user
            let connectedAccounts = []
            if (isSuperAdminRequesting) {
                // Get forum users
                const { data: forumUsers, error: forumUsersError } = await supabase
                    .from("forum_users")
                    .select(
                        "user_id, project_id, forum_username, auth_encrypted_payload, auth_post_id, auth_post_code, auth_post_code_created",
                    )
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
                        authEncryptedPayload: user.auth_encrypted_payload,
                        authPostId: user.auth_post_id,
                        authPostCode: user.auth_post_code,
                        authPostCodeCreated: user.auth_post_code_created,
                    })),
                })

                // Get Discord, X, and Farcaster usernames
                const { data: connectedAccountsData, error: connectedAccountsError } = await supabase
                    .from("users")
                    .select(
                        "id, username, display_name, profile_image_url, discord_username, x_username, farcaster_username",
                    )
                    .in("id", userIds)

                if (connectedAccountsError) {
                    console.error("connectedAccountsError", connectedAccountsError)
                    return NextResponse.json({ error: "Error fetching connected accounts" }, { status: 500 })
                }

                // Add Discord, X, and Farcaster accounts if they exist
                if (connectedAccountsData && connectedAccountsData.length > 0) {
                    const accountTypes = [
                        { field: "discord_username" as keyof (typeof connectedAccountsData)[0], name: "discord" },
                        { field: "x_username" as keyof (typeof connectedAccountsData)[0], name: "x" },
                        { field: "farcaster_username" as keyof (typeof connectedAccountsData)[0], name: "farcaster" },
                    ]

                    accountTypes.forEach(({ field, name }) => {
                        const accounts = connectedAccountsData
                            .filter((user) => user[field])
                            .map((user) => ({
                                userId: user.id,
                                username: user[field] as string,
                            }))

                        if (accounts.length > 0) {
                            connectedAccounts.push({
                                name,
                                data: accounts,
                            })
                        }
                    })
                }
            }

            // Only fetch signal strengths if we have filters applied (username or project)
            let signalStrengths: SignalStrengthGroup[] = []
            if ((username || projectSlug) && !leaderboardOnly) {
                // Get all available signal strengths
                const { data: signalStrengthIds, error: signalStrengthIdsError } = await supabase
                    .from("signal_strengths")
                    .select("id")

                if (signalStrengthIdsError) {
                    console.error("signalStrengthIdsError", signalStrengthIdsError)
                    return NextResponse.json({ error: "Error fetching signal strength ids" }, { status: 500 })
                }

                const signalStrengthIdValues = signalStrengthIds?.map((item) => item.id) || []

                // Create a map of user_id to project_ids
                const userProjectsMap = new Map<string, string[]>()
                userProjectScores.forEach((score) => {
                    if (!userProjectsMap.has(score.user_id)) {
                        userProjectsMap.set(score.user_id, [])
                    }
                    userProjectsMap.get(score.user_id)?.push(score.project_id)
                })

                // Build optimized query to fetch all signal strength data at once
                // Build select statement based on whether it's a superadmin request
                const baseFields = `
                    id,
                    user_id,
                    project_id,
                    signal_strength_id,
                    day,
                    value,
                    max_value,
                    previous_days,
                    summary,
                    description,
                    improvements,
                    last_checked,
                    signal_strengths (
                        name
                    )`

                const superadminFields = isSuperAdminRequesting
                    ? `,
                    prompts (
                        prompt
                    ),
                    request_id,
                    created,
                    explained_reasoning,
                    model,
                    prompt_id,
                    max_chars,
                    logs,
                    prompt_tokens,
                    completion_tokens,
                    raw_value,
                    test_requesting_user`
                    : ""

                const selectFields = baseFields + superadminFields

                // OPTIMIZATION: Create specific user-project combinations instead of cartesian product
                const userProjectCombinations: Array<{ user_id: string; project_id: string }> = []
                userProjectScores.forEach((score) => {
                    userProjectCombinations.push({
                        user_id: score.user_id,
                        project_id: score.project_id,
                    })
                })

                // OPTIMIZATION: Use OR conditions for specific combinations instead of cartesian product
                let signalStrengthsQuery = supabase
                    .from("user_signal_strengths")
                    .select(selectFields)
                    .in("signal_strength_id", signalStrengthIdValues)

                // Build OR conditions for user-project combinations
                if (userProjectCombinations.length > 0) {
                    const orConditions = userProjectCombinations
                        .map((combo) => `and(user_id.eq.${combo.user_id},project_id.eq.${combo.project_id})`)
                        .join(",")

                    signalStrengthsQuery = signalStrengthsQuery.or(orConditions)
                }

                // Filter test data
                if (isSuperAdminRequesting && showTestDataOnly && testRequestingUser) {
                    // Get testRequestingUser ID from the users table
                    const { data: testRequestingUserDetails, error: testRequestingUserDetailsError } = await supabase
                        .from("users")
                        .select("id")
                        .eq("username", testRequestingUser)
                        .single()

                    if (testRequestingUserDetailsError) {
                        console.error("testRequestingUserDetailsError", testRequestingUserDetailsError)
                    }
                    signalStrengthsQuery = signalStrengthsQuery.eq(
                        "test_requesting_user",
                        testRequestingUserDetails?.id,
                    )
                } else {
                    signalStrengthsQuery = signalStrengthsQuery.is("test_requesting_user", null)
                }

                // Filter raw score calc
                if (isSuperAdminRequesting && showRawScoreCalcOnly) {
                    signalStrengthsQuery = signalStrengthsQuery.not("raw_value", "is", null)
                } else {
                    signalStrengthsQuery = signalStrengthsQuery.is("raw_value", null)
                }

                // Fetch signal strength data from the last previousDays max
                const signalStrengthsMap = new Map<string, SignalStrengthData[]>()

                // Use pagination to fetch all signal strength data within the date range
                let allSignalStrengthsData: any[] = []
                let hasMoreSignalData = true
                let signalOffset = 0
                const signalBatchSize = 1000 // Fetch in batches of 1000 records
                let signalBatchCount = 0

                while (hasMoreSignalData) {
                    signalBatchCount++
                    const { data: signalStrengthsBatch, error: signalStrengthsError } = await signalStrengthsQuery
                        .gte("day", previousDaysMaxString)
                        .order("day", { ascending: false })
                        .range(signalOffset, signalOffset + signalBatchSize - 1)

                    if (signalStrengthsError) {
                        console.error("signalStrengthsError", signalStrengthsError)
                        return NextResponse.json({ error: "Error fetching signal strengths" }, { status: 500 })
                    }

                    if (!signalStrengthsBatch || signalStrengthsBatch.length === 0) {
                        hasMoreSignalData = false
                    } else {
                        allSignalStrengthsData = allSignalStrengthsData.concat(signalStrengthsBatch)
                        signalOffset += signalBatchSize

                        // If we got fewer records than the batch size, we've reached the end
                        if (signalStrengthsBatch.length < signalBatchSize) {
                            hasMoreSignalData = false
                        }
                    }
                }

                // Process the data - no need to limit since we're already filtering by date
                if (allSignalStrengthsData) {
                    allSignalStrengthsData.forEach((item: any) => {
                        const key = `${item.user_id}_${item.project_id}_${item.signal_strength_id}`
                        if (!signalStrengthsMap.has(key)) {
                            signalStrengthsMap.set(key, [])
                        }
                        signalStrengthsMap.get(key)!.push(item as unknown as SignalStrengthData)
                    })
                }

                // Convert to the expected format
                signalStrengths = Array.from(signalStrengthsMap.entries()).map(([key, data]) => {
                    const [userId, projectId, signalStrengthId] = key.split("_")
                    return {
                        signalStrengthId,
                        data: data.sort((a, b) => new Date(b.day).getTime() - new Date(a.day).getTime()),
                    }
                })
            }

            // ========================
            // Get all users addresses
            // ========================
            // Lookup all the addresses shared with the project, where the user_id is the same as the user_id in the user table
            let allUsersSharedAddresses: { address: string; users: { id: string }[] }[] = []
            if (apiKeyProjectSlug) {
                const { data: allUsersSharedAddressesData, error: allUsersSharedAddressesDataError } = await supabase
                    .from("user_addresses")
                    .select(
                        `
                        address,
                        user_addresses_shared!inner(
                            projects!inner(
                                id,
                                url_slug
                            )
                        ),
                        users!inner(
                            id,
                            username
                        )
                    `,
                    )
                    .in(
                        "users.username",
                        userProjectScores.map((score) => score.username),
                    )
                    .eq("user_addresses_shared.projects.url_slug", projectSlug)

                if (allUsersSharedAddressesDataError) {
                    console.error("allUsersSharedAddressesDataError", allUsersSharedAddressesDataError)
                    return NextResponse.json({ error: "Error fetching user shared addresses" }, { status: 500 })
                }

                allUsersSharedAddresses = allUsersSharedAddressesData.map((address) => ({
                    address: address.address,
                    users: address.users,
                }))
            }

            // Run a query to get all public addresses
            let allPublicAddresses: { address: string; users: { id: string }[] }[] = []
            if (!leaderboardOnly) {
                const { data: allPublicAddressesData, error: allPublicAddressesError } = await supabase
                    .from("user_addresses")
                    .select(
                        `
                    address,
                    users!inner(
                        id
                    )
                    `,
                    )
                    .eq("is_public", true)
                    .in(
                        "users.username",
                        userProjectScores.map((score) => score.username),
                    )

                if (allPublicAddressesError) {
                    console.error("allPublicAddressesError", allPublicAddressesError)
                    return NextResponse.json({ error: "Error fetching public addresses" }, { status: 500 })
                }

                allPublicAddresses = allPublicAddressesData
            }

            // =======================
            // Get all users accounts
            // =======================
            // Lookup all the accounts shared with the project, where the user_id is the same as the user_id in the user table
            let allUsersSharedAccounts: { type: string; username: string; users: { id: string }[] }[] = []
            if (apiKeyProjectSlug) {
                const { data: allUsersSharedAccountsData, error: allUsersSharedAccountsDataError } = await supabase
                    .from("user_accounts")
                    .select(
                        `
                        type,
                        user_accounts_shared!inner(
                            projects!inner(
                                id,
                                url_slug
                            )
                        ),
                        users!inner(
                            id,
                            username,
                            email,
                            discord_username,
                            x_username,
                            farcaster_username
                        )
                    `,
                    )
                    .in(
                        "users.username",
                        userProjectScores.map((score) => score.username),
                    )
                    .eq("user_accounts_shared.projects.url_slug", projectSlug)

                if (allUsersSharedAccountsDataError) {
                    console.error("allUsersSharedAccountsDataError", allUsersSharedAccountsDataError)
                    return NextResponse.json({ error: "Error fetching user shared accounts" }, { status: 500 })
                }

                allUsersSharedAccounts = allUsersSharedAccountsData.map((account) => {
                    const userData = Array.isArray(account.users) ? account.users[0] : account.users
                    // Dynamically access the username based on the type field
                    const username = (userData as any)[account.type]
                    return {
                        type: account.type,
                        username: username,
                        users: account.users,
                    }
                })
            }

            // Run a query to get all public accounts
            let allPublicAccountsFormatted: { type: string; username: string; users: { id: string }[] }[] = []
            if (!leaderboardOnly) {
                const { data: allPublicAccounts, error: allPublicAccountsError } = await supabase
                    .from("user_accounts")
                    .select(
                        `
                    type,
                    users!inner(
                        id,
                        email,
                        discord_username,
                        x_username,
                        farcaster_username
                    )
                    `,
                    )
                    .eq("is_public", true)
                    .in(
                        "users.username",
                        userProjectScores.map((score) => score.username),
                    )

                if (allPublicAccountsError) {
                    console.error("allPublicAccountsError", allPublicAccountsError)
                    return NextResponse.json({ error: "Error fetching public accounts" }, { status: 500 })
                }

                allPublicAccountsFormatted =
                    allPublicAccounts?.map((account) => {
                        const userData = Array.isArray(account.users) ? account.users[0] : account.users
                        // Dynamically access the username based on the type field
                        const username = (userData as any)[account.type]
                        return {
                            type: account.type,
                            username: username,
                            users: account.users,
                        }
                    }) || []
            }

            // Run a single query to check if any of the users have a last_updated value and it is a leaderboard only request
            // This is so they can be shown as "updating" on the leaderboard while their score is being calculated
            let usersWithLastChecked: { user_id: string; last_checked: number }[] = []
            if (projectSlug && userProjectScores && userProjectScores.length > 0 && leaderboardOnly) {
                const { data: usersWithLastCheckedData, error: usersWithLastCheckedDataError } = await supabase
                    .from("user_signal_strengths")
                    .select("user_id, last_checked")
                    .eq("project_id", userProjectScores[0].project_id)
                    .in(
                        "user_id",
                        userProjectScores.map((score) => score.user_id),
                    )
                    .not("last_checked", "is", null)

                if (usersWithLastCheckedDataError) {
                    console.error("usersWithLastCheckedDataError", usersWithLastCheckedDataError)
                    return NextResponse.json({ error: "Error fetching users with last updated" }, { status: 500 })
                }

                usersWithLastChecked = usersWithLastCheckedData.reduce<{ user_id: string; last_checked: number }[]>(
                    (acc, current) => {
                        const existing = acc.find((item) => item.user_id === current.user_id)
                        if (!existing || current.last_checked < existing.last_checked) {
                            return acc.filter((item) => item.user_id !== current.user_id).concat(current)
                        }
                        return acc
                    },
                    [],
                )
            }

            const formattedUsers = userProjectScores
                .map((score) => {
                    const user = score
                    if (!user) return null

                    // Display any shared addresses for the user
                    let userSharedAddresses: { address: string }[] = []
                    if (allUsersSharedAddresses.length > 0 || (allPublicAddresses && allPublicAddresses.length > 0)) {
                        userSharedAddresses = [
                            ...(allUsersSharedAddresses?.filter(
                                (address) => (address.users as any).id === user.user_id,
                            ) || []),
                            ...(allPublicAddresses?.filter((address) => (address.users as any).id === user.user_id) ||
                                []),
                        ]
                    }

                    // Display any shared accounts for the user
                    let userSharedAccounts: { type: string; username: string }[] = []
                    if (allUsersSharedAccounts.length > 0 || allPublicAccountsFormatted.length > 0) {
                        userSharedAccounts = [
                            ...(allUsersSharedAccounts?.filter(
                                (account) => (account.users as any).id === user.user_id,
                            ) || []),
                            ...(allPublicAccountsFormatted?.filter(
                                (account) => (account.users as any).id === user.user_id,
                            ) || []),
                        ]
                    }

                    // If no username or project filter is applied, return only basic user info
                    if (!username && !projectSlug) {
                        return {
                            ...(isSuperAdminRequesting ? { id: user.user_id } : {}),
                            username: user.username,
                            displayName: user.display_name,
                            profileImageUrl: user.profile_image_url,
                        }
                    }

                    // For filtered requests, return full data with project-specific information
                    const userSignalStrengths =
                        signalStrengths?.filter(
                            (ss) =>
                                ss?.data[0]?.user_id === user.user_id && ss?.data[0]?.project_id === score.project_id,
                        ) || []

                    const historicalScores = historicalTotalScores
                        .filter(
                            (historicalScore) =>
                                historicalScore.user_id === score.user_id &&
                                historicalScore.project_id === score.project_id,
                        )
                        .map((historicalScore) => ({
                            day: historicalScore.day,
                            totalScore: historicalScore.total_score,
                        }))

                    return {
                        ...(isSuperAdminRequesting ? { id: user.user_id } : {}),
                        username: user.username,
                        displayName: user.display_name,
                        profileImageUrl: user.profile_image_url,
                        ...(!projectSlug
                            ? { projectSlug: (score.projects as unknown as { url_slug: string }).url_slug }
                            : {}),
                        ...(score.total_score > 0 ? { rank: score.rank } : {}),
                        score: score.total_score,
                        signal: calculateSignalFromScore(score.total_score),
                        ...(userSharedAddresses.length > 0
                            ? { ethereumAddresses: userSharedAddresses.map((address) => address.address) }
                            : {}),
                        ...(userSharedAccounts.length > 0
                            ? {
                                  accounts: userSharedAccounts.map((account) => ({
                                      type: account.type,
                                      username: account.username,
                                  })),
                              }
                            : {}),
                        ...(isSuperAdminRequesting
                            ? {
                                  connectedAccounts: connectedAccounts.map((account) => ({
                                      name: account.name,
                                      data: account.data
                                          .filter((item) => item.userId === user.user_id)
                                          .map(({ userId, ...rest }) => rest),
                                  })),
                              }
                            : {}),
                        ...(historicalScores.length > 0 ? { historicalScores: historicalScores } : {}),
                        ...(usersWithLastChecked.length > 0
                            ? {
                                  lastChecked: usersWithLastChecked.find((u) => u.user_id === user.user_id)
                                      ?.last_checked,
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
                                scoreCalculationPeriodPreviousDays: d.previous_days,
                                // Only show summary for the latest result, if it is not `No activity in the past` but to anyone
                                // Super admin can see all summaries for all results
                                ...(isSuperAdminRequesting ||
                                (isUserDataVisible && index === 0) ||
                                (index === 0 && !d.summary?.includes("No activity in the past"))
                                    ? {
                                          summary: d.summary,
                                      }
                                    : {}),

                                // Only show details for the latest result to the user or project admin
                                // Super admin can see all details for all results
                                ...(isSuperAdminRequesting || (isUserDataVisible && index === 0)
                                    ? {
                                          description: d.description,
                                          // TODO: Enable improvements when they are better
                                          //   improvements: d.improvements,
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

            // If no filters applied, deduplicate by user_id to avoid multiple entries per user
            if (!username && !projectSlug) {
                const uniqueUsers = new Map()
                formattedUsers.forEach((user) => {
                    if (user && !uniqueUsers.has(user.username)) {
                        uniqueUsers.set(user.username, user)
                    }
                })
                return NextResponse.json({
                    data: Array.from(uniqueUsers.values()),
                    maxPage,
                    totalResults: count,
                    currentPage: page,
                    resultsPerPage,
                })
            }

            return NextResponse.json({
                data: formattedUsers,
                maxPage,
                totalResults: count,
                currentPage: page,
                resultsPerPage,
            })
        }
    } catch (error) {
        console.error("Unhandled error", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

async function usersOnly(
    supabase: SupabaseClient,
    from: number,
    to: number,
    resultsPerPage: number,
    page: number,
    fuzzy: boolean,
    username: string,
) {
    let usersOnlyQuery = supabase
        .from("users")
        .select("username, display_name, profile_image_url", { count: "exact" })
        .range(from, to)
        .order("display_name", { ascending: true })

    if (fuzzy) {
        usersOnlyQuery = usersOnlyQuery.or(`display_name.ilike.%${username}%,username.ilike.%${username}%`)
    } else if (username) {
        usersOnlyQuery = usersOnlyQuery.eq("username", username)
    }

    const { data: usersOnly, count, error: usersOnlyError } = await usersOnlyQuery

    if (usersOnlyError) {
        console.error("usersOnlyError", usersOnlyError)
        return NextResponse.json({ error: "Error fetching user scores" }, { status: 500 })
    }

    const maxPage = Math.ceil((count || 0) / resultsPerPage)
    const maxPageResponse = await checkMaxPage(page, count || 0, resultsPerPage, maxPage)
    if (maxPageResponse instanceof NextResponse) return maxPageResponse

    const formattedUsers = usersOnly.map((user) => ({
        username: user.username,
        displayName: user.display_name,
        profileImageUrl: user.profile_image_url,
    }))

    return NextResponse.json({
        data: formattedUsers,
        maxPage,
        totalResults: count,
        currentPage: page,
        resultsPerPage,
    })
}

async function checkMaxPage(page: number, count: number, resultsPerPage: number, maxPage: number) {
    if (maxPage > 0 && page > maxPage) {
        console.log("maxPage", maxPage)
        return NextResponse.json(
            {
                error: `Invalid page number. Page ${page} exceeds the maximum page number of ${maxPage}`,
                maxPage,
                totalResults: count,
                currentPage: page,
                resultsPerPage,
            },
            { status: 400 },
        )
    }
}
