import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

type ProjectSignalStrength = {
    signal_strengths: {
        name: string
        display_name: string
        project_signal_strengths: Array<{
            max_value: number
            enabled: boolean
            previous_days: number
        }>
    }
}

type Project = {
    url_slug: string
    display_name: string
    project_logo_url: string
    project_signal_strengths: ProjectSignalStrength[]
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get("project")

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
                project_signal_strengths (
                    signal_strengths (
                        name,
                        display_name,
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

        // If there is an error, return it
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
                projectSlug: project.url_slug,
                displayName: project.display_name,
                imageUrl: project.project_logo_url,
                signalStrengths:
                    project.project_signal_strengths?.map((ps) => ({
                        name: ps.signal_strengths.name,
                        displayName: ps.signal_strengths.display_name,
                        maxValue: ps.signal_strengths.project_signal_strengths[0]?.max_value,
                        enabled: ps.signal_strengths.project_signal_strengths[0]?.enabled,
                        previousDays: ps.signal_strengths.project_signal_strengths[0]?.previous_days,
                    })) || [],
            }
        })

        return NextResponse.json(formattedProjects)
    } catch (error) {
        console.error("Internal server error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
