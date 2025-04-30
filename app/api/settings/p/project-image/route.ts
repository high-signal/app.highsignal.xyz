import { NextRequest, NextResponse } from "next/server"
import { uploadImage } from "../../../../../utils/uploadImage"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get("file") as File

        // Get the target project url slug from the URL search params
        const targetProjectUrlSlug = request.nextUrl.searchParams.get("project")
        if (!targetProjectUrlSlug) {
            return NextResponse.json({ error: "Project URL slug is required" }, { status: 400 })
        }

        // Lookup userId from username
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        const { data: project, error: projectError } = await supabase
            .from("projects")
            .select("id")
            .eq("url_slug", targetProjectUrlSlug)
            .single()

        if (projectError) {
            throw new Error(`Failed to lookup project: ${projectError.message}`)
        }

        if (!file || !project?.id) {
            return NextResponse.json({ error: "File and targetId are required" }, { status: 400 })
        }

        const { imageUrl } = await uploadImage(file, `project-logos/${project.id}`, "project_logo")

        // Update the database with new image URL
        const { error: updateError } = await supabase
            .from("projects")
            .update({ project_logo_url: imageUrl })
            .eq("id", project.id)

        if (updateError) {
            throw new Error("Failed to update image in database")
        }

        return NextResponse.json({ imageUrl })
    } catch (error) {
        console.error("Error uploading image:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to upload image" },
            { status: 500 },
        )
    }
}
