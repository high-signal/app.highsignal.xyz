"use client"

import { useEffect, useState } from "react"
import { Button } from "@chakra-ui/react"
import { toaster } from "../ui/toaster"

import { useUser } from "../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"
import { validateUrlSlug, validateDisplayName } from "../../utils/inputValidation"

import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import ImageEditor from "../ui/ImageEditor"
import SettingsInputField from "../ui/SettingsInputField"

export default function GeneralSettingsContainer({ project }: { project: ProjectData }) {
    const { refreshUser } = useUser()
    const { getAccessToken } = usePrivy()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        urlSlug: project.urlSlug || "",
        displayName: project.displayName || "",
        projectLogoUrl: project.projectLogoUrl || "",
    })
    const [errors, setErrors] = useState({
        urlSlug: "",
        displayName: "",
    })
    const [hasChanges, setHasChanges] = useState(false)

    // Display error toast if there is an error
    useEffect(() => {
        if (error) {
            toaster.create({
                title: "❌ Error updating settings",
                description: error,
                type: "error",
            })
            setError(null)
        }
    }, [error])

    const handleImageUpdated = (imageUrl: string) => {
        // Update form data and refresh user data so all the states are updated
        setFormData((prev) => ({
            ...prev,
            projectLogoUrl: imageUrl,
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
            value !== (field === "urlSlug" ? project?.urlSlug : project?.displayName) ||
            Object.keys(formData).some(
                (key) =>
                    key !== field &&
                    formData[key as keyof typeof formData] !==
                        (key === "urlSlug" ? project?.urlSlug : project?.displayName),
            )

        // Only set hasChanges to true if there are changes AND no errors in any field
        const hasAnyErrors = fieldError !== "" || Object.values(errors).some((error) => error !== "")
        setHasChanges(hasAnyChanges && !hasAnyErrors)
    }

    const saveChanges = async () => {
        // Create an object with only the changed fields
        const changedFields: Record<string, string> = {}
        if (formData.urlSlug !== project?.urlSlug) {
            changedFields.urlSlug = formData.urlSlug
        }
        if (formData.displayName !== project?.displayName) {
            changedFields.displayName = formData.displayName
        }

        // If nothing has changed, return early
        if (Object.keys(changedFields).length === 0) {
            return
        }

        setIsSubmitting(true)
        try {
            const token = await getAccessToken()
            const response = await fetch(`/api/settings/p?project=${project?.urlSlug}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
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

    return (
        <SettingsSectionContainer title="Project Settings">
            <ImageEditor
                currentImageUrl={project.projectLogoUrl}
                onImageUploaded={handleImageUpdated}
                targetType="project"
                targetName={project.urlSlug}
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
        </SettingsSectionContainer>
    )
}
