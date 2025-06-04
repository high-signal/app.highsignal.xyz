"use client"

import { useState, useRef } from "react"
import { Box, Center, Image, Text, VStack, Spinner } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCamera } from "@fortawesome/free-solid-svg-icons"
import { toaster } from "./toaster"
import { usePrivy } from "@privy-io/react-auth"
import { ASSETS } from "../../config/constants"

interface ImageEditorProps {
    currentImageUrl?: string
    onImageUploaded?: (imageUrl: string) => void
    targetType: "user" | "project"
    targetName: string
    uploadApiPath: string
}

export default function ImageEditor({
    currentImageUrl,
    onImageUploaded,
    targetType,
    targetName,
    uploadApiPath,
}: ImageEditorProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl || ASSETS.DEFAULT_PROFILE_IMAGE)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { getAccessToken } = usePrivy()

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.match(/^image\/(jpeg|png)$/)) {
            toaster.create({
                title: "❌ Invalid file type",
                description: "Please upload a JPEG or PNG image",
                type: "error",
            })
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toaster.create({
                title: "❌ File too large",
                description: "Please upload an image smaller than 5MB",
                type: "error",
            })
            return
        }

        // Create preview
        const reader = new FileReader()
        reader.onload = (event) => {
            setPreviewUrl(event.target?.result as string)
        }
        reader.readAsDataURL(file)

        // Upload the file
        try {
            setIsUploading(true)

            // Get access token for authorization
            const token = await getAccessToken()

            // Create form data
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch(
                `${uploadApiPath}?${targetType === "user" ? "username" : "project"}=${targetName}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                },
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to upload image")
            }

            const data = await response.json()

            // Call the callback with the new image URL
            if (onImageUploaded) {
                onImageUploaded(data.imageUrl)
            }

            toaster.create({
                title: "✅ Image updated",
                type: "success",
            })
        } catch (error) {
            console.error("Error uploading image:", error)
            toaster.create({
                title: "❌ Error uploading image",
                description: error instanceof Error ? error.message : "An unknown error occurred",
                type: "error",
            })

            // Reset preview on error
            setPreviewUrl(currentImageUrl || ASSETS.DEFAULT_PROFILE_IMAGE)
        } finally {
            setIsUploading(false)
        }
    }

    const handleClick = () => {
        fileInputRef.current?.click()
    }

    return (
        <VStack gap={4} align="center">
            <Box
                position="relative"
                width="150px"
                height="150px"
                borderRadius="full"
                overflow="hidden"
                cursor="pointer"
                onClick={handleClick}
                transform={"scale(1)"}
                transition="transform 0.2s ease-in-out"
                _hover={{
                    transform: { base: "scale(1)", sm: "scale(1.1)" },
                }}
            >
                <Image src={previewUrl} alt="Image" width="100%" height="100%" objectFit="cover" />
                <Center
                    position="absolute"
                    top="0"
                    left="0"
                    width="100%"
                    height="100%"
                    bg="rgba(0,0,0,0.3)"
                    opacity="0"
                    _hover={{ opacity: 1 }}
                    transition="opacity 0.2s"
                >
                    <FontAwesomeIcon icon={faCamera} size="2x" color="white" />
                </Center>

                {isUploading && (
                    <Center position="absolute" top="0" left="0" width="100%" height="100%" bg="rgba(0,0,0,0.5)">
                        <Spinner size="lg" />
                    </Center>
                )}
            </Box>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png"
                style={{ display: "none" }}
            />

            <Text fontSize="sm" color="textColorMuted">
                Click to upload a new image (max 5MB)
            </Text>
        </VStack>
    )
}
