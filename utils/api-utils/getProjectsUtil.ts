import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

type ProjectSignalStrengths = {
    url?: string
    enabled: boolean
    max_value: number
    previous_days: number
    api_enabled?: boolean
    auth_types?: string[]
    auth_parent_post_url?: string
    signal_strengths: {
        name: string
        display_name: string
        status: string
        available_auth_types?: string[]
        model?: string // Requires isSuperAdminRequesting is true
        max_chars?: number //Requires isSuperAdminRequesting is true
    }
}

type Project = {
    id?: number // Requires isSuperAdminRequesting is true
    url_slug: string
    display_name: string
    description?: string
    website?: string
    project_logo_url: string
    api_key?: string
    project_signal_strengths: ProjectSignalStrengths[]
    activeUsers?: number
    highSignalUsers?: number
    midSignalUsers?: number
    lowSignalUsers?: number
    averageScore?: number
}

export async function getProjectsUtil(
    request: Request,
    isProjectAdminRequesting: boolean,
    isSuperAdminRequesting: boolean,
) {
    const projectSlug = request ? new URL(request.url).searchParams.get("project") : null
    const fuzzy = request ? new URL(request.url).searchParams.get("fuzzy") === "true" : false
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    try {
        // Create the initial query to get the projects
        let projectsQuery = supabase
            .from("projects")
            .select(
                `
                id,
                url_slug,
                display_name,
                description,
                website,
                project_logo_url,
                api_key,
                project_signal_strengths (
                    url,
                    enabled,
                    max_value,
                    previous_days,
                    api_enabled,
                    auth_types,
                    auth_parent_post_url,
                    signal_strengths (
                        name,
                        display_name,
                        status,
                        model,
                        max_chars,
                        available_auth_types
                    )
                )
            `,
            )
            .order("url_slug", { ascending: true })
            .limit(10)
        // TODO: Add pagination

        // If projectSlug is provided, add filter to the query
        if (projectSlug) {
            if (fuzzy) {
                projectsQuery = projectsQuery.ilike("display_name", `%${projectSlug}%`)
            } else {
                projectsQuery = projectsQuery.eq("url_slug", projectSlug.toLowerCase())
            }
        }

        // Execute the query
        const { data: projects, error } = await projectsQuery

        // If there is an error, return error response
        if (error) {
            console.error("Error fetching projects:", error)
            return NextResponse.json({ error: "Error fetching projects" }, { status: 500 })
        }

        // If there are no projects, return an empty array
        if (!projects || projects.length === 0) {
            return NextResponse.json([])
        }

        // Get active users count and signal strength breakdowns for each project
        const projectIds = projects.map((p) => p.id).filter(Boolean)
        let activeUsersMap: Record<number, number> = {}
        let highSignalUsersMap: Record<number, number> = {}
        let midSignalUsersMap: Record<number, number> = {}
        let lowSignalUsersMap: Record<number, number> = {}
        let averageScoreMap: Record<number, number> = {}

        if (projectIds.length > 0) {
            // Initialize all project counts to 0 first
            projectIds.forEach((id) => {
                activeUsersMap[id] = 0
                highSignalUsersMap[id] = 0
                midSignalUsersMap[id] = 0
                lowSignalUsersMap[id] = 0
                averageScoreMap[id] = 0
            })

            // Use the database function to get all counts in a single query
            const { data: countData, error: countError } = await supabase.rpc("get_project_active_users_counts", {
                project_ids: projectIds.join(","),
            })

            if (countError) {
                console.error("Error fetching active users counts:", countError)
            } else if (countData) {
                // Use the results from the database function
                const countArray = countData as {
                    project_id: number
                    active_users_count: number
                    high_signal_users: number
                    mid_signal_users: number
                    low_signal_users: number
                    average_score: number
                }[]
                countArray.forEach((row) => {
                    activeUsersMap[row.project_id] = row.active_users_count
                    highSignalUsersMap[row.project_id] = row.high_signal_users
                    midSignalUsersMap[row.project_id] = row.mid_signal_users
                    lowSignalUsersMap[row.project_id] = row.low_signal_users
                    averageScoreMap[row.project_id] = row.average_score
                })
            }
        }

        // Format the projects to match UI naming conventions
        const formattedProjects = (projects as unknown as Project[])
            .map((project) => {
                return {
                    ...(isSuperAdminRequesting ? { id: project.id } : {}),
                    urlSlug: project.url_slug,
                    displayName: project.display_name,
                    description: project.description,
                    website: project.website,
                    projectLogoUrl: project.project_logo_url,
                    ...(isSuperAdminRequesting || isProjectAdminRequesting ? { apiKey: project.api_key } : {}),
                    activeUsers: project.id ? activeUsersMap[project.id] || 0 : 0,
                    highSignalUsers: project.id ? highSignalUsersMap[project.id] || 0 : 0,
                    midSignalUsers: project.id ? midSignalUsersMap[project.id] || 0 : 0,
                    lowSignalUsers: project.id ? lowSignalUsersMap[project.id] || 0 : 0,
                    averageScore: project.id ? averageScoreMap[project.id] || 0 : 0,
                    signalStrengths:
                        project.project_signal_strengths?.map((ps) => ({
                            url: ps.url,
                            name: ps.signal_strengths.name,
                            displayName: ps.signal_strengths.display_name,
                            status: ps.signal_strengths.status,
                            enabled: ps.enabled,
                            maxValue: ps.max_value,
                            apiEnabled: ps.api_enabled,
                            availableAuthTypes: ps.signal_strengths.available_auth_types,
                            authTypes: ps.auth_types,
                            authParentPostUrl: ps.auth_parent_post_url,
                            previousDays: ps.previous_days,
                            ...(isSuperAdminRequesting ? { model: ps.signal_strengths?.model } : {}),
                            ...(isSuperAdminRequesting ? { maxChars: ps.signal_strengths?.max_chars } : {}),
                        })) || [],
                }
            })
            .filter((project) => {
                // Only filter out projects with all disabled signals if it is not a super admin or project admin request
                return (
                    isSuperAdminRequesting ||
                    isProjectAdminRequesting ||
                    project.signalStrengths.some((signal) => signal.enabled)
                )
            })

        return NextResponse.json(formattedProjects)
    } catch (error) {
        console.error("Internal server error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
