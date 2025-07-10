import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"
import { NextRequest, NextResponse } from "next/server"

// Generate a new API key for the project
export async function POST(request: NextRequest) {
    // Get the target project from the URL search params
    const targetProjectUrlSlug = request.nextUrl.searchParams.get("project")

    if (!targetProjectUrlSlug) {
        return NextResponse.json({ error: "Project is required" }, { status: 400 })
    }

    // Generate a new API key (32 bytes => 64 hex characters)
    const newApiKey = randomBytes(32).toString("hex")

    // Get the target project from the database
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Update the project with the new API key
    const { error: updateError } = await supabase
        .from("projects")
        .update({ api_key: newApiKey })
        .eq("url_slug", targetProjectUrlSlug)
        .select()
        .single()

    if (updateError) {
        console.error("Error updating project:", updateError)
        return NextResponse.json({ error: "Error updating project" }, { status: 500 })
    }

    return NextResponse.json({ apiKey: newApiKey }, { status: 200 })
}

// Revoke the API key for the project
export async function DELETE(request: NextRequest) {
    // Get the target project from the URL search params
    const targetProjectUrlSlug = request.nextUrl.searchParams.get("project")

    if (!targetProjectUrlSlug) {
        return NextResponse.json({ error: "Project is required" }, { status: 400 })
    }

    // Get the target project from the database
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Update the project with the new API key
    const { error: updateError } = await supabase
        .from("projects")
        .update({ api_key: null })
        .eq("url_slug", targetProjectUrlSlug)
        .select()
        .single()

    if (updateError) {
        console.error("Error updating project:", updateError)
        return NextResponse.json({ error: "Error updating project" }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
}
