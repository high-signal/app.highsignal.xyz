"use client"

import { useEffect, useState } from "react"
import { Box, Button, Textarea } from "@chakra-ui/react"
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
        website: project.website || "",
        description: project.description || "",
        projectLogoUrl: project.projectLogoUrl || "",
    })
    const [errors, setErrors] = useState({
        urlSlug: "",
        displayName: "",
        website: "",
        description: "",
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

    const handleImageUpdated = async (imageUrl: string) => {
        // Update form data and refresh user data so all the states are updated
        setFormData((prev) => ({
            ...prev,
            projectLogoUrl: imageUrl,
        }))
        await refreshUser()
    }

    const handleFieldChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))

        // Validate the field
        let fieldError = ""
        if (field === "urlSlug") {
            fieldError = validateUrlSlug(value)
        } else if (field === "displayName") {
            fieldError = validateDisplayName(value)
        } else if (field === "website") {
            if (value && !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(value)) {
                fieldError = "Please enter a valid website URL"
            }
        } else if (field === "description") {
            if (value && value.length > 500) {
                fieldError = "Description must be 500 characters or less"
            }
        }

        setErrors((prev) => ({ ...prev, [field]: fieldError }))

        // Check if any field has changed from original values AND there are no errors
        const getOriginalValue = (key: string) => {
            switch (key) {
                case "urlSlug":
                    return project?.urlSlug
                case "displayName":
                    return project?.displayName
                case "website":
                    return project?.website
                case "description":
                    return project?.description
                default:
                    return ""
            }
        }

        const hasAnyChanges =
            value !== getOriginalValue(field) ||
            Object.keys(formData).some(
                (key) => key !== field && formData[key as keyof typeof formData] !== getOriginalValue(key),
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
        if (formData.website !== project?.website) {
            changedFields.website = formData.website
        }
        if (formData.description !== project?.description) {
            changedFields.description = formData.description
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
                } else if (responseData.error?.includes("website")) {
                    setErrors((prev) => ({ ...prev, website: responseData.error }))
                } else if (responseData.error?.includes("description")) {
                    setErrors((prev) => ({ ...prev, description: responseData.error }))
                } else {
                    // Only set general error if it's not a field-specific error
                    setError(responseData.error || "Failed to update settings")
                }
                setHasChanges(false)
                setIsSubmitting(false)
                return
            }

            toaster.create({
                title: "✅ Settings saved successfully",
                type: "success",
            })

            // If urlSlug is changed, redirect to the new urlSlug
            // Full page reload is needed to stop the page from requesting the old urlSlug
            if (changedFields.urlSlug) {
                toaster.create({
                    title: "🔀 Redirecting to new project page...",
                    type: "success",
                })
                setTimeout(() => {
                    window.location.href = `/settings/p/${changedFields.urlSlug.toLowerCase()}`
                }, 2000)
            } else {
                // Refresh the user data after saving changes if urlSlug is not changed
                await refreshUser()
                setHasChanges(false)
                setIsSubmitting(false)
            }
        } catch (error) {
            toaster.create({
                title: "❌ Error updating settings",
                description: error instanceof Error ? error.message : "An unknown error occurred",
                type: "error",
            })
            console.error("Error updating settings:", error)
            setError("An error occurred while saving changes")
            setIsSubmitting(false)
        }
    }

    return (
        <SettingsSectionContainer>
            <ImageEditor
                currentImageUrl={project.projectLogoUrl}
                onImageUploaded={handleImageUpdated}
                targetType="project"
                targetName={project.urlSlug}
                uploadApiPath="/api/settings/p/project-image"
            />
            <SettingsInputField
                label="Project Identifier"
                description="Your project identifier is unique to your project."
                lozengeTypes={["public"]}
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
                label="Project Display Name"
                description="Your project display name is shown on your project page."
                lozengeTypes={["public"]}
                value={formData.displayName}
                onChange={(e) => handleFieldChange("displayName", e.target.value)}
                error={errors.displayName}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && hasChanges && !isSubmitting) {
                        saveChanges()
                    }
                }}
            />
            <SettingsInputField
                label="Website"
                description="Your project's website URL (optional)."
                lozengeTypes={["public"]}
                value={formData.website}
                onChange={(e) => handleFieldChange("website", e.target.value)}
                error={errors.website}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && hasChanges && !isSubmitting) {
                        saveChanges()
                    }
                }}
            />
            <SettingsInputField
                h={"fit-content"}
                label="Description"
                description="A brief description of your project (optional)."
                lozengeTypes={["public"]}
                value={formData.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                error={errors.description}
                inputReplacement={
                    <Box w="100%">
                        <Textarea
                            value={formData.description}
                            onChange={(e) => handleFieldChange("description", e.target.value)}
                            placeholder="Describe your project..."
                            rows={4}
                            resize="none"
                            h={"100px"}
                            overflowY="auto"
                            fontSize="md"
                            borderRadius="16px"
                            border="3px solid"
                            borderColor="transparent"
                            _focus={{
                                borderColor: "input.border",
                                boxShadow: "none",
                                outline: "none",
                            }}
                            _hover={{
                                borderColor: "input.borderHover",
                                boxShadow: "none",
                                outline: "none",
                            }}
                            bg="contentBackground"
                            color="textColor"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && e.ctrlKey && hasChanges && !isSubmitting) {
                                    saveChanges()
                                }
                            }}
                        />
                        <Box fontSize="sm" color="gray.500" mt={1} px={2}>
                            {formData.description.length}/500 characters
                        </Box>
                    </Box>
                }
            />
            <Box bg={"pageBackground"} w="100%" h={"fit-content"} px={3}>
                <Button
                    primaryButton
                    onClick={saveChanges}
                    loading={isSubmitting}
                    disabled={!hasChanges || isSubmitting}
                    w="100%"
                    borderRadius="full"
                    h={"40px"}
                >
                    Save Changes
                </Button>
            </Box>
        </SettingsSectionContainer>
    )
}
