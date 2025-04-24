import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import sharp from "sharp"
import { createClient } from "@supabase/supabase-js"

// Define Cloudinary response type
interface CloudinaryResponse {
    secure_url: string
    public_id: string
    version: number
    width: number
    height: number
    format: string
    resource_type: string
}

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
    try {
        // Get form data
        const formData = await request.formData()
        const file = formData.get("file") as File
        const userId = formData.get("userId") as string

        if (!file || !userId) {
            return NextResponse.json({ error: "File and userId are required" }, { status: 400 })
        }

        // Validate file type
        if (!file.type.match(/^image\/(jpeg|png|)$/)) {
            return NextResponse.json({ error: "Invalid file type. Only JPEG and PNG are allowed." }, { status: 400 })
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 })
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer())

        // Process image with sharp
        const processedBuffer = await sharp(buffer)
            .resize(300, 300, { fit: "cover", position: "center" })
            .toFormat("webp", { quality: 80 })
            .toBuffer()

        // Upload to Cloudinary
        const uploadResponse = await new Promise<CloudinaryResponse>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `profile-images/${userId}`,
                    resource_type: "image",
                    format: "webp",
                    transformation: [{ width: 300, height: 300, crop: "fill" }, { quality: "auto" }],
                },
                (error: Error | undefined, result: CloudinaryResponse | undefined) => {
                    if (error) reject(error)
                    else if (result) resolve(result)
                    else reject(new Error("No result returned from Cloudinary"))
                },
            )

            // Write the processed buffer to the upload stream
            uploadStream.end(processedBuffer)
        })

        // Get the secure URL from the upload response
        const imageUrl = uploadResponse.secure_url

        // Update user profile in database with new image URL
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        const { error: updateError } = await supabase
            .from("users")
            .update({ profile_image_url: imageUrl })
            .eq("id", userId)

        if (updateError) {
            console.error("Error updating user profile image:", updateError)
            return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
        }

        return NextResponse.json({ imageUrl })
    } catch (error) {
        console.error("Error uploading profile image:", error)
        return NextResponse.json({ error: "Failed to upload profile image" }, { status: 500 })
    }
}
