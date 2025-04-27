import { v2 as cloudinary } from "cloudinary"
import sharp from "sharp"
import { APP_CONFIG } from "../config/constants"

interface CloudinaryResponse {
    secure_url: string
    public_id: string
    version: number
    width: number
    height: number
    format: string
    resource_type: string
}

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadImage(file: File, folderPath: string, tag?: string): Promise<{ imageUrl: string }> {
    try {
        // Validate file type
        if (!file.type.match(/^image\/(jpeg|png|)$/)) {
            throw new Error("Invalid file type. Only JPEG and PNG are allowed.")
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error("File too large. Maximum size is 5MB.")
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer())

        // Process image with sharp
        const processedBuffer = await sharp(buffer)
            .resize(APP_CONFIG.IMAGE_UPLOAD_WIDTH, APP_CONFIG.IMAGE_UPLOAD_WIDTH, { fit: "cover", position: "center" })
            .toFormat("webp", { quality: 80 })
            .toBuffer()

        // Upload to Cloudinary
        const uploadResponse = await new Promise<CloudinaryResponse>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folderPath,
                    resource_type: "image",
                    format: "webp",
                    transformation: [{ width: 300, height: 300, crop: "fill" }, { quality: "auto" }],
                    tags: tag ? [tag] : undefined,
                    invalidate: tag ? true : false,
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

        return { imageUrl }
    } catch (error) {
        console.error("Error uploading profile image:", error)
        throw error
    }
}
