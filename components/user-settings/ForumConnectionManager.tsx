"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Text, Button, Spinner, Menu, Portal, HStack, Box, Image, Skeleton } from "@chakra-ui/react"
import { toaster } from "../ui/toaster"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEllipsisVertical, faSignOut } from "@fortawesome/free-solid-svg-icons"

import { useUser } from "../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"

import SettingsInputField from "../ui/SettingsInputField"

export default function ForumConnectionManager({
    targetUser,
    config,
}: {
    targetUser: UserData
    config: {
        projectDisplayName: string
        projectUrlSlug: string
        projectLogoUrl: string | undefined
        forumUrl: string | undefined
    }
}) {
    const { getAccessToken } = usePrivy()
    const { refreshUser } = useUser()
    const router = useRouter()

    const [isConnected, setIsConnected] = useState(false)
    const [isConnectedLoading, setIsConnectedLoading] = useState(true)
    const [forumUsername, setForumUsername] = useState("")
    const [isForumSubmitting, setIsForumSubmitting] = useState(false)
    const [isProcessingForumAuthRequest, setIsProcessingForumAuthRequest] = useState(false)

    // Check if the user is connected to the forum
    useEffect(() => {
        const forumUsername = targetUser.forumUsers?.find(
            (forumUser) => forumUser.projectUrlSlug === config.projectUrlSlug,
        )?.forumUsername

        if (forumUsername) {
            setForumUsername(forumUsername)
            setIsConnected(true)
        } else {
            setIsConnected(false)
            setForumUsername("")
        }
        setIsConnectedLoading(false)
    }, [targetUser, config])

    // If the page is loaded with the query params type, project, and payload
    // process that as a returned value from a forum auth request
    useEffect(() => {
        const processForumAuthRequest = async () => {
            const urlParams = new URLSearchParams(window.location.search)
            const type = urlParams.get("type")
            const project = urlParams.get("project")
            const payload = urlParams.get("payload")

            if (type && project === config.projectUrlSlug && payload) {
                console.log("Processing forum auth request")
                setIsForumSubmitting(true)

                // Post the payload, target username, and project url slug to the /api/accounts/forum_users route
                const token = await getAccessToken()
                const forumResponse = await fetch(
                    `/api/accounts/forum_users?username=${targetUser.username}&project=${config.projectUrlSlug}`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            payload,
                        }),
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    },
                )

                if (!forumResponse.ok) {
                    setIsForumSubmitting(false)
                    const errorData = await forumResponse.json()
                    throw new Error(errorData.error || "Failed to process forum auth request")
                }

                // If forum response is ok, clear the extra query params from the url
                urlParams.delete("type")
                urlParams.delete("project")
                urlParams.delete("payload")

                // Preserve other URL parameters by using the remaining params
                const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : "")
                window.history.replaceState({}, "", newUrl)

                // Refresh the user data
                refreshUser()

                // Stop the loading animation
                setIsForumSubmitting(false)

                // Show success message
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
        }

        if (!isProcessingForumAuthRequest) {
            processForumAuthRequest()
            setIsProcessingForumAuthRequest(true)
        }
    }, [config.projectUrlSlug, getAccessToken, refreshUser, router, targetUser, isProcessingForumAuthRequest])

    const handleForumConnection = async (projectUrlSlug: string) => {
        try {
            setIsForumSubmitting(true)

            const token = await getAccessToken()
            const authRequestResponse = await fetch(
                `/api/accounts/forum_users?username=${targetUser.username}&project=${projectUrlSlug}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            )

            if (!authRequestResponse.ok) {
                const errorData = await authRequestResponse.json()
                throw new Error(errorData.error || "Failed to get forum user auth URL")
            }

            if (authRequestResponse.ok) {
                const responseData = await authRequestResponse.json()
                window.location.href = responseData.url
            }
        } catch (error) {
            console.error("Error connecting forum username:", error)
            setIsForumSubmitting(false)
            toaster.create({
                title: "❌ Error connecting forum username",
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
        <SettingsInputField
            label={`${config.projectDisplayName} Forum`}
            labelIcon={
                config.projectLogoUrl && (
                    <Box boxSize="16px" ml={1} mr={1} mb={1}>
                        <Image
                            src={config.projectLogoUrl}
                            alt={config.projectDisplayName}
                            boxSize="100%"
                            objectFit="cover"
                            borderRadius="full"
                            transform="scale(1.5)"
                        />
                    </Box>
                )
            }
            description={!isConnectedLoading && isConnected ? `Your ${config.projectDisplayName} Forum username.` : ""}
            isPrivate={true}
            value={forumUsername}
            error=""
            isEditable={!isForumSubmitting && !isConnected}
            inputReplacement={
                isConnectedLoading ? (
                    <Skeleton defaultSkeleton h={"100%"} w={"100%"} borderRadius="full" />
                ) : (
                    !isConnected && (
                        <Button
                            primaryButton
                            h={"100%"}
                            w={"100%"}
                            onClick={() => handleForumConnection(config.projectUrlSlug)}
                            borderRadius="full"
                            disabled={isForumSubmitting}
                        >
                            {isForumSubmitting ? (
                                <Spinner size="sm" color="white" />
                            ) : (
                                <Text fontWeight="bold">Connect</Text>
                            )}
                        </Button>
                    )
                )
            }
            rightElement={
                !isConnectedLoading &&
                isConnected && (
                    <Menu.Root>
                        <Menu.Trigger asChild>
                            <Button
                                successButton
                                h={"100%"}
                                w={"120px"}
                                pl={2}
                                pr={0}
                                border={"2px solid"}
                                color="lozenge.text.active"
                                borderColor="lozenge.border.active"
                                borderRightRadius="full"
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
    )
}
