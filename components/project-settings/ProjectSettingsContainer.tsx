"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { VStack, Text, Button, Spinner, Menu, Portal, HStack, Box } from "@chakra-ui/react"
import { toaster } from "../ui/toaster"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEllipsisVertical, faSignOut } from "@fortawesome/free-solid-svg-icons"

import { useUser } from "../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"
import { validateUrlSlug, validateDisplayName } from "../../utils/inputValidation"

import ContentContainer from "../layout/ContentContainer"
import ImageEditor from "../ui/ImageEditor"
import SettingsInputField from "../ui/SettingsInputField"

export default function ProjectSettingsContainer() {
    const { loggedInUser, loggedInUserLoading, refreshUser } = useUser()
    const { getAccessToken } = usePrivy()
    const params = useParams()
    const router = useRouter()

    const [project, setProject] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        urlSlug: "",
        displayName: "",
        projectLogoUrl: "",
    })
    const [errors, setErrors] = useState({
        urlSlug: "",
        displayName: "",
    })
    const [hasChanges, setHasChanges] = useState(false)

    // Initialize form data
    useEffect(() => {
        const fetchUserData = async () => {
            if (!loggedInUser) {
                setIsLoading(false)
                setError("Please log in to access project settings")
                return
            }

            const urlSlug = params?.project as string
            if (!urlSlug) {
                setError("No project name provided")
                return
            }

            try {
                const token = await getAccessToken()
                const response = await fetch(`/api/settings/p?project=${urlSlug}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "x-target-project": urlSlug,
                    },
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    console.error("Failed to fetch project data:", errorData)
                    throw new Error(errorData.error || "Failed to fetch project data")
                }

                const data = await response.json()
                setProject(data)
                setFormData({
                    urlSlug: data.url_slug || "",
                    displayName: data.display_name || "",
                    projectLogoUrl: data.project_logo_url || "",
                })
            } catch (err) {
                console.error("Error in fetchUserData:", err)
                setError(err instanceof Error ? err.message : "An error occurred")
            } finally {
                setIsLoading(false)
            }
        }

        if (!loggedInUserLoading) {
            fetchUserData()
        }
    }, [loggedInUser, loggedInUserLoading, params?.project, getAccessToken, router])

    const handleImageUpdated = (imageUrl: string) => {
        setFormData((prev) => ({
            ...prev,
            profileImageUrl: imageUrl,
        }))
        refreshUser()
    }

    const handleFieldChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))

        // Validate the field
        let fieldError = ""
        if (field === "urlSlug") {
            fieldError = validateUrlSlug(value)
        } else if (field === "displayName") {
            fieldError = validateDisplayName(value)
        }

        setErrors((prev) => ({ ...prev, [field]: fieldError }))

        // Check if any field has changed from original values AND there are no errors
        const hasAnyChanges =
            value !== (field === "urlSlug" ? project?.url_slug : project?.display_name) ||
            Object.keys(formData).some(
                (key) =>
                    key !== field &&
                    formData[key as keyof typeof formData] !==
                        (key === "urlSlug" ? project?.url_slug : project?.display_name),
            )

        // Only set hasChanges to true if there are changes AND no errors in any field
        const hasAnyErrors = fieldError !== "" || Object.values(errors).some((error) => error !== "")
        setHasChanges(hasAnyChanges && !hasAnyErrors)
    }

    const saveChanges = async () => {
        // Create an object with only the changed fields
        const changedFields: Record<string, string> = {}
        if (formData.urlSlug !== project?.url_slug) {
            changedFields.urlSlug = formData.urlSlug
        }
        if (formData.displayName !== project?.display_name) {
            changedFields.displayName = formData.displayName
        }

        // If nothing has changed, return early
        if (Object.keys(changedFields).length === 0) {
            return
        }

        setIsSubmitting(true)
        try {
            const token = await getAccessToken()
            const response = await fetch("/api/settings/p", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    "x-target-project": project?.url_slug,
                },
                body: JSON.stringify({
                    targetProjectUrlSlug: project?.url_slug,
                    changedFields: changedFields,
                }),
            })

            const responseData = await response.json()

            if (!response.ok) {
                // Handle specific API errors
                if (responseData.error === "URL slug is already taken" || responseData.error?.includes("urlSlug")) {
                    setErrors((prev) => ({ ...prev, urlSlug: responseData.error }))
                } else if (responseData.error?.includes("display name")) {
                    setErrors((prev) => ({ ...prev, displayName: responseData.error }))
                } else {
                    // Only set general error if it's not a field-specific error
                    setError(responseData.error || "Failed to update settings")
                }
                setHasChanges(false)
                return
            }

            toaster.create({
                title: "✅ Settings saved successfully",
                type: "success",
            })

            // Refresh the user data after saving changes
            await refreshUser()
            setHasChanges(false)

            // If urlSlug is changed, redirect to the new urlSlug
            // Full page reload is needed to stop the page from requesting the old urlSlug
            if (changedFields.urlSlug) {
                window.location.href = `/settings/p/${changedFields.urlSlug.toLowerCase()}`
            }
        } catch (error) {
            toaster.create({
                title: "❌ Error updating settings",
                description: error instanceof Error ? error.message : "An unknown error occurred",
                type: "error",
            })
            console.error("Error updating settings:", error)
            setError("An error occurred while saving changes")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <ContentContainer>
                <VStack gap={10} w="100%" minH="300px" justifyContent="center" alignItems="center" borderRadius="20px">
                    <Spinner size="lg" />
                </VStack>
            </ContentContainer>
        )
    }

    if (error) {
        return (
            <ContentContainer>
                <VStack>
                    <Text color="orange.700">{error}</Text>
                </VStack>
            </ContentContainer>
        )
    }

    if (!project) {
        return (
            <ContentContainer>
                <VStack>
                    <Text>Project not found</Text>
                </VStack>
            </ContentContainer>
        )
    }

    return (
        <ContentContainer>
            <VStack gap={6} w="100%" maxW="500px" mx="auto" p={4}>
                <Text fontSize="2xl" fontWeight="bold">
                    Project Settings
                </Text>
                <ImageEditor
                    currentImageUrl={project.project_logo_url}
                    onImageUploaded={handleImageUpdated}
                    targetType="project"
                    targetId={project.id}
                    targetName={project.name}
                    uploadApiPath="/api/settings/p/project-image"
                />
                <SettingsInputField
                    label="Project URL Slug"
                    description="Your project URL slug is unique and is used to identify your project."
                    isPrivate={false}
                    value={formData.urlSlug}
                    onChange={(e) => handleFieldChange("urlSlug", e.target.value)}
                    error={errors.urlSlug}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && hasChanges && !isSubmitting) {
                            saveChanges()
                        }
                    }}
                />
                <SettingsInputField
                    label="Display Name"
                    description="Your display name is shown on your project page."
                    isPrivate={false}
                    value={formData.displayName}
                    onChange={(e) => handleFieldChange("displayName", e.target.value)}
                    error={errors.displayName}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && hasChanges && !isSubmitting) {
                            saveChanges()
                        }
                    }}
                />
                <Button
                    colorScheme="blue"
                    onClick={saveChanges}
                    loading={isSubmitting}
                    disabled={!hasChanges || isSubmitting}
                    w="100%"
                    borderRadius="full"
                >
                    Save Changes
                </Button>
            </VStack>
        </ContentContainer>
    )
}
