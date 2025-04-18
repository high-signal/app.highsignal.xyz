"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { VStack, Text, Button, Spinner } from "@chakra-ui/react"
import { toaster } from "../ui/toaster"

import { useUser } from "../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"
import { validateUsername, validateDisplayName } from "../../utils/userValidation"

import ContentContainer from "../layout/ContentContainer"
import SettingsInputField from "./SettingsInputField"

export default function UserSettingsContainer() {
    const { user, isLoading: userLoading, refreshUser } = useUser()
    const { getAccessToken } = usePrivy()
    const params = useParams()
    const router = useRouter()
    const [targetUser, setTargetUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        username: "",
        displayName: "",
    })
    const [errors, setErrors] = useState({
        username: "",
        displayName: "",
    })
    const [hasChanges, setHasChanges] = useState(false)

    // Initialize form with user data
    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) {
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
                    displayName: data.display_name || "",
                })
            } catch (err) {
                console.error("Error in fetchUserData:", err)
                setError(err instanceof Error ? err.message : "An error occurred")
            } finally {
                setIsLoading(false)
            }
        }

        if (!userLoading) {
            fetchUserData()
        }
    }, [user, userLoading, params?.username, getAccessToken, router])

    // Handle field changes
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
            value !== (field === "username" ? targetUser?.username : targetUser?.display_name) ||
            Object.keys(formData).some(
                (key) =>
                    key !== field &&
                    formData[key as keyof typeof formData] !==
                        (key === "username" ? targetUser?.username : targetUser?.display_name),
            )

        // Only set hasChanges to true if there are changes AND no errors in any field
        const hasAnyErrors = fieldError !== "" || Object.values(errors).some((error) => error !== "")
        setHasChanges(hasAnyChanges && !hasAnyErrors)
    }

    // Save all changes
    const saveChanges = async () => {
        // Validate all fields first
        const usernameError = validateUsername(formData.username)
        const displayNameError = validateDisplayName(formData.displayName)

        setErrors({
            username: usernameError,
            displayName: displayNameError,
        })

        if (usernameError || displayNameError) {
            return
        }

        // Create an object with only the changed fields
        const changedFields: Record<string, string> = {}
        if (formData.username !== targetUser?.username) {
            changedFields.username = formData.username
        }
        if (formData.displayName !== targetUser?.display_name) {
            changedFields.displayName = formData.displayName
        }

        // If nothing has changed, return early
        if (Object.keys(changedFields).length === 0) {
            return
        }

        setIsSubmitting(true)
        try {
            const token = await getAccessToken()
            const response = await fetch("/api/users", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(changedFields),
            })

            const data = await response.json()

            if (!response.ok) {
                // Handle specific API errors
                if (data.error === "Username is already taken" || data.error?.includes("username")) {
                    setErrors((prev) => ({ ...prev, username: data.error }))
                } else if (data.error?.includes("display name")) {
                    setErrors((prev) => ({ ...prev, displayName: data.error }))
                } else {
                    // Only set general error if it's not a field-specific error
                    setError(data.error || "Failed to update settings")
                }
                setHasChanges(false)
                return
            }

            toaster.create({
                title: "✅ Settings saved successfully",
                type: "success",
            })

            await refreshUser()
            setHasChanges(false)

            // If username is changed, redirect to the new username
            // Full page reload is needed to stop the page from requesting the old username
            if (changedFields.username) {
                window.location.href = `/settings/u/${changedFields.username}`
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

    // TODO: Style this
    if (isLoading) {
        return (
            <ContentContainer>
                <VStack gap={10} w="100%" minH="300px" justifyContent="center" alignItems="center" borderRadius="20px">
                    <Spinner size="lg" />
                </VStack>
            </ContentContainer>
        )
    }

    // TODO: Style this
    if (error) {
        return (
            <ContentContainer>
                <VStack>
                    <Text color="orange.700">{error}</Text>
                </VStack>
            </ContentContainer>
        )
    }

    // TODO: Style this
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

                <SettingsInputField
                    label="Username"
                    description="Your username is unique and is used to identify you."
                    isPrivate={false}
                    value={formData.username}
                    onChange={(e) => handleFieldChange("username", e.target.value)}
                    error={errors.username}
                />

                <SettingsInputField
                    label="Display Name"
                    description="Your display name is shown on your profile."
                    isPrivate={false}
                    value={formData.displayName}
                    onChange={(e) => handleFieldChange("displayName", e.target.value)}
                    error={errors.displayName}
                />

                <Button
                    colorScheme="blue"
                    onClick={saveChanges}
                    loading={isSubmitting}
                    disabled={!hasChanges || isSubmitting}
                    w="100%"
                    mt={4}
                    borderRadius="full"
                >
                    Save Changes
                </Button>
            </VStack>
        </ContentContainer>
    )
}
