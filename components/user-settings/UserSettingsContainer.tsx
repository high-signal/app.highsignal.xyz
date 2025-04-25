"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { VStack, Text, Button, Spinner, Menu, Portal, HStack, Box } from "@chakra-ui/react"
import { toaster } from "../ui/toaster"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEllipsisVertical, faSignOut } from "@fortawesome/free-solid-svg-icons"

import { useUser } from "../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"
import { validateUsername, validateDisplayName } from "../../utils/inputValidation"

import ContentContainer from "../layout/ContentContainer"
import SettingsInputField from "../ui/SettingsInputField"
import ImageEditor from "../ui/ImageEditor"
import ConnectedAccountsContainer from "./ConnectedAccountsContainer"

export default function UserSettingsContainer() {
    const { loggedInUser, loggedInUserLoading, refreshUser } = useUser()
    const { getAccessToken } = usePrivy()
    const params = useParams()
    const router = useRouter()
    const [targetUser, setTargetUser] = useState<UserData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        username: "",
        displayName: "",
        profileImageUrl: "",
    })
    const [errors, setErrors] = useState({
        username: "",
        displayName: "",
    })
    const [hasChanges, setHasChanges] = useState(false)

    // Initialize form with user data
    useEffect(() => {
        const fetchUserData = async () => {
            if (!loggedInUser) {
                setIsLoading(false)
                setError("Please log in to view your settings")
                return
            }

            const username = params?.username as string
            if (!username) {
                setError("No username provided")
                return
            }

            try {
                const token = await getAccessToken()
                const response = await fetch(`/api/settings/u?username=${username}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "x-target-username": username,
                    },
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    console.error("Failed to fetch user data:", errorData)
                    throw new Error(errorData.error || "Failed to fetch user data")
                }

                const data = await response.json()
                setTargetUser(data)
                setFormData({
                    username: data.username || "",
                    displayName: data.displayName || "",
                    profileImageUrl: data.profileImageUrl || "",
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
    }, [loggedInUser, loggedInUserLoading, params?.username, getAccessToken, router])

    const handleProfileImageUpdated = (imageUrl: string) => {
        // Update form data and refresh user data so all the states are updated
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
            const response = await fetch("/api/settings/u", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    "x-target-username": targetUser!.username!,
                },
                body: JSON.stringify({
                    targetUsername: targetUser?.username,
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
                return
            }

            toaster.create({
                title: "✅ Settings saved successfully",
                type: "success",
            })

            // Refresh the user data after saving changes
            await refreshUser()
            setHasChanges(false)

            // If username is changed, redirect to the new username
            // Full page reload is needed to stop the page from requesting the old username
            if (changedFields.username) {
                window.location.href = `/settings/u/${changedFields.username.toLowerCase()}`
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

    if (!targetUser) {
        return (
            <ContentContainer>
                <VStack>
                    <Text>User not found</Text>
                </VStack>
            </ContentContainer>
        )
    }

    return (
        <ContentContainer>
            <VStack gap={6} w="100%" maxW="500px" mx="auto" p={4}>
                <Text fontSize="2xl" fontWeight="bold">
                    User Settings
                </Text>
                <ImageEditor
                    currentImageUrl={formData.profileImageUrl}
                    onImageUploaded={handleProfileImageUpdated}
                    targetType="user"
                    targetId={targetUser!.id!}
                    targetName={targetUser!.username!}
                    uploadApiPath="/api/settings/u/profile-image"
                />
                <SettingsInputField
                    label="Username"
                    description="Your username is unique and is used to identify you."
                    isPrivate={false}
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
            <ConnectedAccountsContainer targetUser={targetUser} refreshUser={refreshUser} />
        </ContentContainer>
    )
}
