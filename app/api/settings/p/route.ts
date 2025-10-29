import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validateUrlSlug, validateDisplayName } from "../../../../utils/inputValidation"
import { sanitize } from "../../../../utils/sanitize"
import { getProjectsUtil } from "../../../../utils/api-utils/getProjectsUtil"

export async function GET(request: NextRequest) {
    // Check if the requesting user is a super admin to provide more data
    const isSuperAdmin = request.headers.get("x-is-super-admin") === "true"

    return getProjectsUtil(request, true, isSuperAdmin)
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

        // Validate website if provided
        if (changedFields.website) {
            // Basic URL validation
            const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
            if (!urlPattern.test(changedFields.website)) {
                return NextResponse.json({ error: "Please enter a valid website URL" }, { status: 400 })
            }
        }

        // Validate description if provided
        if (changedFields.description) {
            if (changedFields.description.length > 500) {
                return NextResponse.json({ error: "Description must be 500 characters or less" }, { status: 400 })
            }
        }

        // ************************************************
        // SANITIZE USER INPUTS BEFORE STORING IN DATABASE
        // ************************************************
        const updateData: Record<string, any> = {}
        if (changedFields.urlSlug) updateData.url_slug = sanitize(changedFields.urlSlug.toLowerCase())
        if (changedFields.displayName) updateData.display_name = sanitize(changedFields.displayName)
        if (changedFields.website) updateData.website = sanitize(changedFields.website)
        if (changedFields.description) updateData.description = sanitize(changedFields.description)

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

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error("Unhandled error in project update:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
