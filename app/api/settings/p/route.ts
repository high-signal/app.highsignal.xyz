import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validateUrlSlug, validateDisplayName } from "../../../../utils/inputValidation"
import { sanitize } from "../../../../utils/sanitize"

type ProjectSignalStrength = {
    signal_strengths: {
        name: string
        display_name: string
        status: string
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
    peak_signals_enabled: boolean
    peak_signals_max_value: number
    project_signal_strengths: ProjectSignalStrength[]
}

export async function GET(request: NextRequest) {
    try {
        // Get the target project from the URL search params
        const targetProjectUrlSlug = request.nextUrl.searchParams.get("project")
        if (!targetProjectUrlSlug) {
            return NextResponse.json({ error: "Project is required" }, { status: 400 })
        }

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Get the target project from the database
        const { data: targetProject, error: targetProjectError } = await supabase
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
            .eq("url_slug", targetProjectUrlSlug)
            .single()

        if (targetProjectError) {
            console.error("Error fetching target project:", targetProjectError)
            return NextResponse.json({ error: "Target project not found" }, { status: 404 })
        }

        // Format the projects to match UI naming conventions
        const formattedProject = {
            urlSlug: targetProject.url_slug,
            displayName: targetProject.display_name,
            projectLogoUrl: targetProject.project_logo_url,
            peakSignalsMaxValue: targetProject.peak_signals_max_value,
            peakSignalsEnabled: targetProject.peak_signals_enabled,
            signalStrengths:
                (targetProject as unknown as Project).project_signal_strengths?.map((ps) => ({
                    name: ps.signal_strengths.name,
                    displayName: ps.signal_strengths.display_name,
                    status: ps.signal_strengths.status,
                    maxValue: ps.signal_strengths.project_signal_strengths[0]?.max_value,
                    enabled: ps.signal_strengths.project_signal_strengths[0]?.enabled,
                    previousDays: ps.signal_strengths.project_signal_strengths[0]?.previous_days,
                })) || [],
        }

        return NextResponse.json(formattedProject)
    } catch (error) {
        console.error("Error fetching project settings:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// Authenticated PATCH request
// Updates a project in the database
// Takes a JSON body with updated parameters
export async function PATCH(request: NextRequest) {
    try {
        // Get the target project from the URL search params
        const targetProjectUrlSlug = request.nextUrl.searchParams.get("project")
        if (!targetProjectUrlSlug) {
            return NextResponse.json({ error: "Project is required" }, { status: 400 })
        }

        // Parse the request body
        const body = await request.json()
        const { changedFields } = body

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Get the target project
        const { data: targetProject, error: projectError } = await supabase
            .from("projects")
            .select("id")
            .eq("url_slug", targetProjectUrlSlug)
            .single()

        if (projectError) {
            console.error("Error fetching project:", projectError)
            return NextResponse.json({ error: "Error fetching project" }, { status: 500 })
        }

        if (!targetProject) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 })
        }

        // Validate urlSlug if provided
        if (changedFields.urlSlug) {
            const urlSlugError = validateUrlSlug(changedFields.urlSlug.toLowerCase())
            if (urlSlugError) {
                return NextResponse.json({ error: urlSlugError }, { status: 400 })
            }

            // Check if project urlSlug is already taken by another project
            const { data: existingProject, error: existingProjectError } = await supabase
                .from("projects")
                .select("id")
                .eq("url_slug", changedFields.urlSlug.toLowerCase())
                .neq("id", targetProject.id)
                .single()

            if (existingProjectError && existingProjectError.code !== "PGRST116") {
                console.error("Error checking project urlSlug:", existingProjectError)
                return NextResponse.json({ error: "Error checking project urlSlug" }, { status: 500 })
            }

            if (existingProject) {
                return NextResponse.json({ error: "Project urlSlug is already taken" }, { status: 409 })
            }
        }

        // Validate display name if provided
        if (changedFields.displayName) {
            const displayNameError = validateDisplayName(changedFields.displayName.toLowerCase())
            if (displayNameError) {
                return NextResponse.json({ error: displayNameError }, { status: 400 })
            }
        }

        // ************************************************
        // SANITIZE USER INPUTS BEFORE STORING IN DATABASE
        // ************************************************
        const updateData: Record<string, any> = {}
        if (changedFields.urlSlug) updateData.url_slug = sanitize(changedFields.urlSlug.toLowerCase())
        if (changedFields.displayName) updateData.display_name = sanitize(changedFields.displayName)

        // Update project
        const { data: updatedProject, error: updateError } = await supabase
            .from("projects")
            .update(updateData)
            .eq("id", targetProject.id)
            .select()
            .single()

        if (updateError) {
            console.error("Error updating user:", updateError)
            return NextResponse.json({ error: "Error updating user" }, { status: 500 })
        }

        return NextResponse.json(updatedProject)
    } catch (error) {
        console.error("Unhandled error in project update:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
