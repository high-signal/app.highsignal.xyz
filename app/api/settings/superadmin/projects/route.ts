import { NextRequest, NextResponse } from "next/server"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        const tempProjectName = randomUUID().split("-")[0]
        console.log("tempProjectName", tempProjectName)

        // Create a new project entry
        const { data: createdProjectData, error: createProjectError } = await supabase
            .from("projects")
            .insert({
                display_name: tempProjectName,
                url_slug: tempProjectName,
            })
            .select()
            .single()

        if (createProjectError) {
            return NextResponse.json({ error: "Error creating project" }, { status: 500 })
        }

        const newProjectId = createdProjectData.id

        // Find all signal strengths
        const { data: signalStrengthsData, error: signalStrengthsError } = await supabase
            .from("signal_strengths")
            .select("id, available_auth_types")

        if (signalStrengthsError) {
            return NextResponse.json({ error: "Error fetching signals" }, { status: 500 })
        }

        // For each signal strength, create a new project_signal_strength entry
        for (const signalStrength of signalStrengthsData) {
            await supabase.from("project_signal_strengths").insert({
                project_id: newProjectId,
                signal_strength_id: signalStrength.id,
                ...(signalStrength.available_auth_types?.includes("privy") ? { auth_types: ["privy"] } : {}),
            })
        }

        return NextResponse.json(
            { success: true, message: "Project created successfully", project: { url_slug: tempProjectName } },
            { status: 200 },
        )
    } catch (error) {
        console.error("Error creating project:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
