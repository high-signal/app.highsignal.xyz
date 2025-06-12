import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sanitize } from "../../../../../utils/sanitize"
import { validateSignalStrengthProjectSettings } from "../../../../../utils/validateSignalStrengthProjectSettings"

// Authenticated PATCH request
// Updates a project_signal_strengths in the DB
// Takes a JSON body with updated parameters
export async function PATCH(request: NextRequest) {
    try {
        // Get the target project and signal strength name from the URL search params
        const targetProjectUrlSlug = request.nextUrl.searchParams.get("project")
        const targetSignalStrengthName = request.nextUrl.searchParams.get("signal_strength")
        if (!targetProjectUrlSlug || !targetSignalStrengthName) {
            return NextResponse.json({ error: "Project and signal strength name are required" }, { status: 400 })
        }

        // Parse the request body
        const body = await request.json()
        const { settings } = body

        const validationErrors = validateSignalStrengthProjectSettings(settings)
        if (validationErrors.length > 0) {
            return NextResponse.json({ error: validationErrors }, { status: 400 })
        }

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Get the target project id from the database
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

        // Get the target signal strength id from the database
        const { data: targetSignalStrength, error: signalStrengthError } = await supabase
            .from("signal_strengths")
            .select("id, available_auth_types")
            .eq("name", targetSignalStrengthName)
            .single()

        if (signalStrengthError) {
            console.error("Error fetching signal strength:", signalStrengthError)
            return NextResponse.json({ error: "Error fetching signal strength" }, { status: 500 })
        }

        if (!targetSignalStrength) {
            return NextResponse.json({ error: "Signal strength not found" }, { status: 404 })
        }

        // ************************************************
        // SANITIZE USER INPUTS BEFORE STORING IN DATABASE
        // ************************************************
        const updateData: Record<string, any> = {}

        // If the new state is disabled, set all other fields to their default values
        if (settings.enabled.new === false) {
            updateData.enabled = false
            updateData.max_value = 20
            updateData.previous_days = 90
            updateData.url = null
            updateData.auth_types = null
            updateData.auth_parent_post_url = null
        } else {
            if (settings.maxValue.new !== null) updateData.max_value = parseInt(sanitize(settings.maxValue.new))
            if (settings.previousDays.new !== null)
                updateData.previous_days = parseInt(sanitize(settings.previousDays.new))
            if (settings.enabled.new !== null) updateData.enabled = Boolean(settings.enabled.new)
            if (settings.url.new !== null) updateData.url = sanitize(settings.url.new)

            if (settings.authTypes.new !== null) {
                // Validate that all provided auth types are allowed for this signal strength
                const invalidAuthTypes = settings.authTypes.new.filter(
                    (type: string) => !targetSignalStrength.available_auth_types.includes(type),
                )

                if (invalidAuthTypes.length > 0) {
                    return NextResponse.json(
                        {
                            error: `Invalid auth types provided: ${invalidAuthTypes.join(", ")}. Allowed types are: ${targetSignalStrength.available_auth_types.join(", ")}`,
                        },
                        { status: 400 },
                    )
                }

                updateData.auth_types = `{${settings.authTypes.new.map((type: string) => `"${type}"`).join(",")}}`
            }

            // Clear auth_parent_post_url if manual_post is not in the auth types
            if (settings.authTypes.new && !settings.authTypes.new.includes("manual_post")) {
                updateData.auth_parent_post_url = null
            } else if (settings.authParentPostUrl.new !== null) {
                updateData.auth_parent_post_url = sanitize(settings.authParentPostUrl.new)
            }
        }

        // Update project_signal_strengths
        const { error: updateError } = await supabase
            .from("project_signal_strengths")
            .update(updateData)
            .eq("project_id", targetProject.id)
            .eq("signal_strength_id", targetSignalStrength.id)
            .select()
            .single()

        if (updateError) {
            console.error("Error updating signal strength settings:", updateError)
            return NextResponse.json({ error: "Error updating signal strength settings" }, { status: 500 })
        }

        // If the new authTypes no longer contains api_auth, clear auth_encrypted_payload for this project
        if (
            settings.authTypes?.new &&
            settings.authTypes?.new.length > 0 &&
            !settings.authTypes?.new?.includes("api_auth")
        ) {
            const { error: updateForumUsersError } = await supabase
                .from("forum_users")
                .update({ auth_encrypted_payload: null })
                .eq("project_id", targetProject.id)

            if (updateForumUsersError) {
                console.error("Error clearing auth_encrypted_payload:", updateForumUsersError)
                return NextResponse.json({ error: "Error clearing auth_encrypted_payload" }, { status: 500 })
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Unhandled error in project settings signal strength update:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
