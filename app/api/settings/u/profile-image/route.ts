import { NextRequest, NextResponse } from "next/server"
import { uploadImage } from "../../../../../utils/uploadImage"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get("file") as File
        const targetId = formData.get("targetId") as string

        if (!file || !targetId) {
            return NextResponse.json({ error: "File and targetId are required" }, { status: 400 })
        }

        const { imageUrl } = await uploadImage(file, `profile-images/${targetId}`, "profile_image")

        // Update the database with new image URL
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        const { error: updateError } = await supabase
            .from("users")
            .update({ profile_image_url: imageUrl })
            .eq("id", targetId)

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
