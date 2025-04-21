"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { VStack, Text, Button, Spinner, Menu, Portal, HStack, Box } from "@chakra-ui/react"
import { toaster } from "../ui/toaster"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEllipsisVertical, faSignOut } from "@fortawesome/free-solid-svg-icons"

import { useUser } from "../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"
import { validateUsername, validateDisplayName } from "../../utils/userValidation"

import ContentContainer from "../layout/ContentContainer"
import SettingsInputField from "./SettingsInputField"
import ProfileImageEditor from "./ProfileImageEditor"

export default function UserSettingsContainer() {
    const { loggedInUser, loggedInUserLoading, refreshUser } = useUser()
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
        profileImageUrl: "",
    })
    const [errors, setErrors] = useState({
        username: "",
        displayName: "",
    })
    const [hasChanges, setHasChanges] = useState(false)
    const [forumUsername, setForumUsername] = useState("")
    const [isForumSubmitting, setIsForumSubmitting] = useState(false)
    const [hasForumChanges, setHasForumChanges] = useState(false)

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
                    profileImageUrl: data.profile_image_url || "",
                })
                // Set the forum username from the API response
                if (data.forum_users && data.forum_users.length > 0) {
                    setForumUsername(data.forum_users[0].forum_username || "")
                    // Set hasForumChanges to false if there's a forum username
                    setHasForumChanges(false)
                } else {
                    // If there's no forum username, set hasForumChanges to true
                    setHasForumChanges(true)
                }
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
                title: "✅ㅤSettings saved successfully",
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
                title: "❌ㅤError updating settings",
                description: error instanceof Error ? error.message : "An unknown error occurred",
                type: "error",
            })
            console.error("Error updating settings:", error)
            setError("An error occurred while saving changes")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleForumChange = async (forumUsername: string, user_id: string, project_id: string) => {
        try {
            setIsForumSubmitting(true)

            // Call the forum_users PUT route
            const forumResponse = await fetch("/api/accounts/forum_users", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id,
                    project_id,
                    forum_username: forumUsername,
                }),
            })

            if (!forumResponse.ok) {
                const errorData = await forumResponse.json()
                throw new Error(errorData.error || "Failed to update forum username")
            }

            // Update the targetUser state with the new forum username
            setTargetUser((prev: any) => ({
                ...prev,
                forum_users: [
                    {
                        ...prev.forum_users[0],
                        forum_username: forumUsername,
                    },
                ],
            }))

            // Reset the form state
            setHasForumChanges(false)

            // Show success message
            toaster.create({
                title: "✅ㅤForum username updated",
                description:
                    "Your forum username has been updated successfully. It may take a few minutes to update your signal score.",
                type: "success",
                action: {
                    label: "View Profile",
                    // TODO: Uncomment this when the profile page is implemented
                    // onClick: () => router.push(`/u/${targetUser.username}`),
                    onClick: () => router.push(`/p/lido/${loggedInUser?.username}`),
                },
            })
        } catch (error) {
            console.error("Error updating forum username:", error)
            toaster.create({
                title: "❌ㅤError updating forum username",
                description: error instanceof Error ? error.message : "An unknown error occurred",
                type: "error",
            })
        } finally {
            setIsForumSubmitting(false)
        }
    }

    const handleForumInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setForumUsername(newValue)

        // Check if the value has changed from the current value in targetUser
        if (targetUser && targetUser.forum_users && targetUser.forum_users.length > 0) {
            const currentValue = targetUser.forum_users[0].forum_username
            setHasForumChanges(newValue !== currentValue)
        } else {
            // If there's no current forum username from the API, set hasForumChanges to true
            // This ensures we show the "Connect" button when typing
            setHasForumChanges(true)
        }
    }

    // Handle Enter key press in the forum username input
    const handleForumKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && hasForumChanges && forumUsername && !isForumSubmitting) {
            handleForumChange(forumUsername, targetUser.id, "1")
        }
    }

    const handleForumDisconnect = async (user_id: string, project_id: string, signal_strength_id: string) => {
        try {
            setIsForumSubmitting(true)

            // Call the forum_users DELETE route
            const forumResponse = await fetch("/api/accounts/forum_users", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id,
                    project_id,
                    signal_strength_id,
                }),
            })

            if (!forumResponse.ok) {
                const errorData = await forumResponse.json()
                throw new Error(errorData.error || "Failed to disconnect forum username")
            }

            // Update the targetUser state to remove the forum username
            setTargetUser((prev: any) => ({
                ...prev,
                forum_users: [],
            }))

            // Reset the form state
            setForumUsername("")
            setHasForumChanges(true)

            // Show success message
            toaster.create({
                title: "✅ㅤForum account disconnected",
                description: "Your forum account has been disconnected successfully.",
                type: "success",
            })
        } catch (error) {
            console.error("Error disconnecting forum username:", error)
            toaster.create({
                title: "❌ㅤError disconnecting forum account",
                description: error instanceof Error ? error.message : "An unknown error occurred",
                type: "error",
            })
        } finally {
            setIsForumSubmitting(false)
        }
    }

    const handleProfileImageUpdated = (imageUrl: string) => {
        setFormData((prev) => ({
            ...prev,
            profileImageUrl: imageUrl,
        }))
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
                <ProfileImageEditor
                    currentImageUrl={formData.profileImageUrl}
                    onImageUploaded={handleProfileImageUpdated}
                    userId={targetUser.id}
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
            <VStack gap={6} w="100%" maxW="500px" mx="auto" p={4}>
                <Text fontSize="2xl" fontWeight="bold">
                    Connected Accounts
                </Text>
                <SettingsInputField
                    label="Lido Forum"
                    description="Your Lido Forum username."
                    isPrivate={true}
                    value={forumUsername}
                    onChange={handleForumInputChange}
                    onKeyDown={handleForumKeyDown}
                    error=""
                    isEditable={hasForumChanges}
                    rightElement={
                        hasForumChanges ? (
                            <Button
                                h={"35px"}
                                w={"120px"}
                                bg="orange.500"
                                _hover={{ bg: "orange.600" }}
                                color="white"
                                borderColor="green.500"
                                onClick={() => handleForumChange(forumUsername, targetUser.id, "1")}
                                loading={isForumSubmitting}
                                borderRightRadius="full"
                                cursor={!forumUsername || isForumSubmitting ? "default" : "pointer"}
                                disabled={!forumUsername || isForumSubmitting}
                            >
                                <Text fontWeight="bold">Connect</Text>
                            </Button>
                        ) : (
                            <Menu.Root>
                                <Menu.Trigger asChild>
                                    <Button
                                        h={"35px"}
                                        w={"120px"}
                                        pl={2}
                                        pr={0}
                                        border={"2px solid"}
                                        bg="green.500"
                                        color="#029E03"
                                        borderColor="#029E03"
                                        borderRightRadius="full"
                                        cursor="pointer"
                                        _hover={{ bg: "green.700" }}
                                        disabled={isForumSubmitting}
                                    >
                                        <HStack gap={1}>
                                            {isForumSubmitting ? (
                                                <Spinner size="sm" color="#029E03" />
                                            ) : (
                                                <>
                                                    <Text fontWeight="bold">Connected</Text>
                                                    <FontAwesomeIcon icon={faEllipsisVertical} size="lg" />
                                                </>
                                            )}
                                        </HStack>
                                    </Button>
                                </Menu.Trigger>
                                <Portal>
                                    <Menu.Positioner mt={"-4px"}>
                                        <Menu.Content borderRadius={"full"} borderWidth={2} overflow={"hidden"} p={0}>
                                            <Menu.Item
                                                h={"35px"}
                                                py={2}
                                                pl={3}
                                                cursor={"pointer"}
                                                value="disconnect"
                                                overflow={"hidden"}
                                                onClick={() => handleForumDisconnect(targetUser.id, "1", "1")}
                                            >
                                                <HStack overflow={"hidden"}>
                                                    <Text fontWeight="bold" color="orange.500">
                                                        Disconnect
                                                    </Text>
                                                    <Box w="20px">
                                                        <FontAwesomeIcon icon={faSignOut} />
                                                    </Box>
                                                </HStack>
                                            </Menu.Item>
                                        </Menu.Content>
                                    </Menu.Positioner>
                                </Portal>
                            </Menu.Root>
                        )
                    }
                />
            </VStack>
        </ContentContainer>
    )
}
