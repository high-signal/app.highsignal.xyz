"use client"

import { useEffect, useState } from "react"
import { Box, Button, Text, VStack } from "@chakra-ui/react"
import { toaster } from "../ui/toaster"

import { useUser } from "../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"
import { validateUsername, validateDisplayName } from "../../utils/inputValidation"

import SettingsInputField from "../ui/SettingsInputField"
import ImageEditor from "../ui/ImageEditor"
import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import DeleteAccountContainer from "./DeleteAccountContainer"
import Divider from "../ui/Divider"

export default function GeneralSettingsContainer({ targetUser }: { targetUser: UserData }) {
    const { refreshUser } = useUser()
    const { getAccessToken } = usePrivy()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        username: targetUser?.username || "",
        displayName: targetUser?.displayName || "",
        profileImageUrl: targetUser?.profileImageUrl || "",
    })
    const [errors, setErrors] = useState({
        username: "",
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

    const handleProfileImageUpdated = async (imageUrl: string) => {
        // Update form data and refresh user data so all the states are updated
        setFormData((prev) => ({
            ...prev,
            profileImageUrl: imageUrl,
        }))
        await refreshUser()
    }

    const handleFieldChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))

        // Validate the field
        let fieldError = ""
        if (field === "username") {
            fieldError = validateUsername(value)
        } else if (field === "displayName") {
            fieldError = validateDisplayName(value)
        }

        setErrors((prev) => ({ ...prev, [field]: fieldError }))

        // Check if any field has changed from original values AND there are no errors
        const hasAnyChanges =
            value !== (field === "username" ? targetUser?.username : targetUser?.displayName) ||
            Object.keys(formData).some(
                (key) =>
                    key !== field &&
                    formData[key as keyof typeof formData] !==
                        (key === "username" ? targetUser?.username : targetUser?.displayName),
            )

        // Only set hasChanges to true if there are changes AND no errors in any field
        const hasAnyErrors = fieldError !== "" || Object.values(errors).some((error) => error !== "")
        setHasChanges(hasAnyChanges && !hasAnyErrors)
    }

    const saveChanges = async () => {
        // Create an object with only the changed fields
        const changedFields: Record<string, string> = {}
        if (formData.username !== targetUser?.username) {
            changedFields.username = formData.username
        }
        if (formData.displayName !== targetUser?.displayName) {
            changedFields.displayName = formData.displayName
        }

        // If nothing has changed, return early
        if (Object.keys(changedFields).length === 0) {
            return
        }

        setIsSubmitting(true)
        try {
            const token = await getAccessToken()
            const response = await fetch(`/api/settings/u?username=${targetUser?.username}`, {
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
                if (responseData.error === "Username is already taken" || responseData.error?.includes("username")) {
                    setErrors((prev) => ({ ...prev, username: responseData.error }))
                } else if (responseData.error?.includes("display name")) {
                    setErrors((prev) => ({ ...prev, displayName: responseData.error }))
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

            // If username is changed, redirect to the new username
            // Full page reload is needed to stop the page from requesting the old username
            if (changedFields.username) {
                toaster.create({
                    title: "🔀 Redirecting to new username...",
                    type: "success",
                })
                setTimeout(() => {
                    window.location.href = `/settings/u/${changedFields.username.toLowerCase()}`
                }, 2000)
            } else {
                // Refresh the user data after saving changes if username is not changed
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
                currentImageUrl={formData.profileImageUrl}
                onImageUploaded={handleProfileImageUpdated}
                targetType="user"
                targetName={targetUser!.username!}
                uploadApiPath="/api/settings/u/profile-image"
            />
            {targetUser.defaultProfile && (
                <VStack
                    bg={"contentBackground"}
                    p={4}
                    borderRadius="16px"
                    w="100%"
                    border="5px solid"
                    borderColor="contentBorder"
                    textAlign="center"
                    gap={4}
                >
                    <Text fontSize="2xl" fontWeight="bold">
                        Welcome to High Signal 👋
                    </Text>
                    <Text>This is your personal settings page.</Text>
                    <Text>A default profile image, username and display name have been created for you.</Text>
                    <Text>Change these here to finish setting up your profile.</Text>
                </VStack>
            )}
            <SettingsInputField
                label="Username"
                description="Your username is unique and is used to identify you."
                lozengeTypes={["public"]}
                value={formData.username}
                onChange={(e) => handleFieldChange("username", e.target.value)}
                error={errors.username}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && hasChanges && !isSubmitting) {
                        saveChanges()
                    }
                }}
            />
            <SettingsInputField
                label="Display Name"
                description="Your display name is shown on your profile."
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
            <Box h={4} />
            <Divider />
            <Box px={3} w="100%">
                <DeleteAccountContainer targetUser={targetUser} />
            </Box>
        </SettingsSectionContainer>
    )
}
