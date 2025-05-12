"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Text, Button, Spinner, Menu, Portal, HStack, Box } from "@chakra-ui/react"
import { toaster } from "../ui/toaster"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEllipsisVertical, faSignOut } from "@fortawesome/free-solid-svg-icons"

import { useUser } from "../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"

import SettingsInputField from "../ui/SettingsInputField"
import SettingsSectionContainer from "../ui/SettingsSectionContainer"

export default function ConnectedAccountsContainer({ targetUser }: { targetUser: UserData }) {
    const { getAccessToken } = usePrivy()
    const { refreshUser } = useUser()
    const router = useRouter()

    const [isConnected, setIsConnected] = useState(false)
    const [forumUsername, setForumUsername] = useState("")
    const [isForumSubmitting, setIsForumSubmitting] = useState(false)

    useEffect(() => {
        if (targetUser && targetUser.forumUsers && targetUser.forumUsers.length > 0) {
            setForumUsername(targetUser.forumUsers[0].forumUsername)
            setIsConnected(true)
        } else {
            setIsConnected(false)
            setForumUsername("")
        }
    }, [targetUser])

    const handleForumInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForumUsername(e.target.value)
    }

    // Handle Enter key press in the forum username input
    const handleForumKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !isForumSubmitting) {
            // TODO: Check field has value
            handleForumChange(forumUsername, targetUser.id!, 1)
        }
    }

    const handleForumChange = async (forumUsername: string, user_id: number, project_id: number) => {
        try {
            setIsForumSubmitting(true)

            const token = await getAccessToken()
            const forumResponse = await fetch(`/api/accounts/forum_users?username=${targetUser?.username}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                // TODO: When refactoring this section, remove any frontend defined values for security.
                // Look up everything on the backend
                body: JSON.stringify({
                    user_id,
                    project_id,
                    forum_username: forumUsername,
                    signal_strength_name: "discourse_forum",
                }),
            })

            if (!forumResponse.ok) {
                const errorData = await forumResponse.json()
                throw new Error(errorData.error || "Failed to update forum username")
            }

            if (forumResponse.ok) {
                // Reset the form state
                setIsConnected(true)
                setIsForumSubmitting(false)

                toaster.create({
                    title: "✅ Forum username updated",
                    description:
                        "Your forum username has been updated successfully. View your profile to see the calculation in progress.",
                    type: "success",
                    action: {
                        label: "View Profile",
                        // TODO: Uncomment this when the profile page is implemented
                        // onClick: () => router.push(`/u/${targetUser.username}`),
                        onClick: () => router.push(`/p/lido/${targetUser?.username}#discourse_forum`),
                    },
                })
            }
        } catch (error) {
            console.error("Error updating forum username:", error)
            setIsForumSubmitting(false)
            toaster.create({
                title: "❌ Error updating forum username",
                description: error instanceof Error ? error.message : "An unknown error occurred",
                type: "error",
            })
        }
    }

    const handleForumDisconnect = async (user_id: number, project_id: number, signal_strength_id: number) => {
        try {
            setIsForumSubmitting(true)

            // Call the forum_users DELETE route
            const token = await getAccessToken()
            const forumResponse = await fetch(`/api/accounts/forum_users?username=${targetUser?.username}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                // TODO: When refactoring this section, remove any frontend defined values for security.
                // Look up everything on the backend
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

            // Refresh the user data
            refreshUser()

            // Show success message
            toaster.create({
                title: "✅ Forum account disconnected",
                type: "success",
            })
        } catch (error) {
            console.error("Error disconnecting forum username:", error)
            toaster.create({
                title: "❌ Error disconnecting forum account",
                description: error instanceof Error ? error.message : "An unknown error occurred",
                type: "error",
            })
        } finally {
            setIsForumSubmitting(false)
        }
    }

    return (
        <SettingsSectionContainer>
            <SettingsInputField
                label="Lido Forum"
                description="Your Lido Forum username."
                isPrivate={true}
                value={forumUsername}
                onChange={handleForumInputChange}
                onKeyDown={handleForumKeyDown}
                error=""
                isEditable={!isForumSubmitting && !isConnected}
                rightElement={
                    !isConnected ? (
                        <Button
                            h={"35px"}
                            w={"120px"}
                            bg="orange.500"
                            _hover={{ bg: "orange.600" }}
                            color="white"
                            borderColor="orange.500"
                            onClick={() => handleForumChange(forumUsername, targetUser.id!, 1)}
                            borderRightRadius="full"
                            cursor={!forumUsername || isForumSubmitting ? "default" : "pointer"}
                            disabled={!forumUsername || isForumSubmitting}
                        >
                            {isForumSubmitting ? (
                                <Spinner size="sm" color="white" />
                            ) : (
                                <Text fontWeight="bold">Connect</Text>
                            )}
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
                                    bg="lozenge.background.active"
                                    color="lozenge.text.active"
                                    borderColor="lozenge.border.active"
                                    borderRightRadius="full"
                                    cursor={isForumSubmitting ? "default" : "pointer"}
                                    _hover={{ bg: "lozenge.background.active" }}
                                    disabled={isForumSubmitting}
                                >
                                    <HStack gap={1}>
                                        {isForumSubmitting ? (
                                            <Spinner size="sm" color="lozenge.text.active" />
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
                                            onClick={() => handleForumDisconnect(targetUser.id!, 1, 1)}
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
        </SettingsSectionContainer>
    )
}
