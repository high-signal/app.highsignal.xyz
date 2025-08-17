import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

type ProjectSignalStrengths = {
    url?: string
    enabled: boolean
    max_value: number
    previous_days: number
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
    project_logo_url: string
    api_key?: string
    project_signal_strengths: ProjectSignalStrengths[]
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
                project_logo_url,
                api_key,
                project_signal_strengths (
                    url,
                    enabled,
                    max_value,
                    previous_days,
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

        // Format the projects to match UI naming conventions
        const formattedProjects = (projects as unknown as Project[])
            .map((project) => {
                return {
                    ...(isSuperAdminRequesting ? { id: project.id } : {}),
                    urlSlug: project.url_slug,
                    displayName: project.display_name,
                    projectLogoUrl: project.project_logo_url,
                    ...(isSuperAdminRequesting || isProjectAdminRequesting ? { apiKey: project.api_key } : {}),
                    signalStrengths:
                        project.project_signal_strengths?.map((ps) => ({
                            url: ps.url,
                            name: ps.signal_strengths.name,
                            displayName: ps.signal_strengths.display_name,
                            status: ps.signal_strengths.status,
                            enabled: ps.enabled,
                            maxValue: ps.max_value,
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
