import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

type ProjectSignalStrength = {
    signal_strengths: {
        name: string
        display_name: string
        status: string
        project_signal_strengths: Array<{
            max_value: number
            enabled: boolean
            previous_days: number
            model?: string // Only present if isSuperAdminRequesting is true
            prompt?: string // Only present if isSuperAdminRequesting is true
        }>
    }
}

type Project = {
    url_slug: string
    display_name: string
    project_logo_url: string
    peak_signals_enabled: boolean
    peak_signals_max_value: number
    project_signal_strengths: ProjectSignalStrength[]
}

export async function getProjects(request: Request, isSuperAdminRequesting: boolean = false) {
    const projectSlug = request ? new URL(request.url).searchParams.get("project") : null
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    try {
        // Create the initial query to get the projects
        let projectsQuery = supabase
            .from("projects")
            .select(
                `
                url_slug,
                display_name,
                project_logo_url,
                peak_signals_enabled,
                peak_signals_max_value,
                project_signal_strengths (
                    signal_strengths (
                        name,
                        display_name,
                        status,
                        project_signal_strengths (
                            max_value,
                            enabled,
                            previous_days
                        )
                    )
                )
            `,
            )
            .order("id", { ascending: true })
            .limit(10)

        // If projectSlug is provided, add filter to the query
        if (projectSlug) {
            projectsQuery = projectsQuery.eq("url_slug", projectSlug)
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
        const formattedProjects = (projects as unknown as Project[]).map((project) => {
            return {
                urlSlug: project.url_slug,
                displayName: project.display_name,
                projectLogoUrl: project.project_logo_url,
                peakSignalsMaxValue: project.peak_signals_max_value,
                peakSignalsEnabled: project.peak_signals_enabled,
                signalStrengths:
                    project.project_signal_strengths?.map((ps) => ({
                        name: ps.signal_strengths.name,
                        displayName: ps.signal_strengths.display_name,
                        status: ps.signal_strengths.status,
                        maxValue: ps.signal_strengths.project_signal_strengths[0]?.max_value,
                        enabled: ps.signal_strengths.project_signal_strengths[0]?.enabled,
                        previousDays: ps.signal_strengths.project_signal_strengths[0]?.previous_days,
                        ...(isSuperAdminRequesting
                            ? { model: ps.signal_strengths.project_signal_strengths[0]?.model }
                            : {}),
                        ...(isSuperAdminRequesting
                            ? { prompt: ps.signal_strengths.project_signal_strengths[0]?.prompt }
                            : {}),
                    })) || [],
            }
        })

        return NextResponse.json(formattedProjects)
    } catch (error) {
        console.error("Internal server error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
