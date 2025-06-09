"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Text, Button, Spinner, Menu, Portal, HStack, Box, Image, Skeleton, Dialog, VStack } from "@chakra-ui/react"
import { toaster } from "../ui/toaster"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEllipsisVertical, faRefresh, faSignOut } from "@fortawesome/free-solid-svg-icons"

import { useUser } from "../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"

import SettingsInputField from "../ui/SettingsInputField"

interface CustomMenuItemProps {
    value: string
    onClick?: () => void
    isHeading?: boolean
    children: React.ReactNode
}

const CustomMenuItem = ({ value, onClick, isHeading = false, children }: CustomMenuItemProps) => (
    <Menu.Item
        h={"35px"}
        pointerEvents={isHeading ? "none" : "auto"}
        cursor={"pointer"}
        value={value}
        overflow={"hidden"}
        onClick={onClick}
        transition={"all 0.2s ease"}
        _active={{ bg: "button.contentButton.active" }}
        _highlighted={{ bg: "button.contentButton.hover" }}
        px={4}
        py={3}
    >
        {children}
    </Menu.Item>
)

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

    const signalStrengthName = "discourse_forum"

    const [isConnected, setIsConnected] = useState(false)
    const [isConnectedLoading, setIsConnectedLoading] = useState(true)
    const [forumUsername, setForumUsername] = useState("")
    const [isForumSubmitting, setIsForumSubmitting] = useState(false)
    const [isProcessingForumAuthRequest, setIsProcessingForumAuthRequest] = useState(false)

    const [isDisconnectCheckOpen, setIsDisconnectCheckOpen] = useState(false)

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
                        onClick: () => router.push(`/p/lido/${targetUser?.username}#${signalStrengthName}`),
                    },
                })
            }
        }

        if (!isProcessingForumAuthRequest) {
            processForumAuthRequest()
            setIsProcessingForumAuthRequest(true)
        }
    }, [config.projectUrlSlug, getAccessToken, refreshUser, router, targetUser, isProcessingForumAuthRequest])

    const handleForumConnection = async () => {
        try {
            setIsForumSubmitting(true)

            const token = await getAccessToken()
            const authRequestResponse = await fetch(
                `/api/accounts/forum_users?username=${targetUser.username}&project=${config.projectUrlSlug}`,
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

    const handleForumDisconnect = async () => {
        try {
            setIsForumSubmitting(true)

            // Call the forum_users DELETE route
            const token = await getAccessToken()
            const forumResponse = await fetch(
                `/api/accounts/forum_users?username=${targetUser?.username}&project=${config.projectUrlSlug}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            )

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
        <>
            {isDisconnectCheckOpen && (
                <Dialog.Root
                    placement={{ base: "center", md: "center" }}
                    motionPreset="slide-in-bottom"
                    open={isDisconnectCheckOpen}
                >
                    <Portal>
                        <Dialog.Backdrop bg="rgba(0, 0, 0, 0.5)" backdropFilter="blur(3px)" />
                        <Dialog.Positioner>
                            <Dialog.Content borderRadius={"16px"} p={0} bg={"pageBackground"}>
                                <Dialog.Header>
                                    <Dialog.Title>
                                        Disconnect your {config.projectDisplayName} forum account
                                    </Dialog.Title>
                                </Dialog.Header>
                                <Dialog.Body>
                                    <VStack gap={2} alignItems={"start"}>
                                        <Text>
                                            Are you sure you want to disconnect your {config.projectDisplayName} forum
                                            account?
                                        </Text>
                                        <Text>
                                            This will remove all your engagement data for this project and reduce your
                                            score.
                                        </Text>
                                        <Text>
                                            If you want to update your forum username, you can use the &quot;Refresh
                                            connection&quot; button instead.
                                        </Text>
                                    </VStack>
                                </Dialog.Body>
                                <Dialog.Footer>
                                    <Dialog.ActionTrigger asChild>
                                        <Button
                                            secondaryButton
                                            borderRadius={"full"}
                                            px={4}
                                            py={2}
                                            onClick={() => setIsDisconnectCheckOpen(false)}
                                        >
                                            No - Take me back
                                        </Button>
                                    </Dialog.ActionTrigger>
                                    <Button
                                        dangerButton
                                        borderRadius={"full"}
                                        px={4}
                                        py={2}
                                        onClick={() => {
                                            setIsDisconnectCheckOpen(false)
                                            handleForumDisconnect()
                                        }}
                                    >
                                        <Text>Yes I&apos;m sure - Disconnect</Text>
                                    </Button>
                                </Dialog.Footer>
                            </Dialog.Content>
                        </Dialog.Positioner>
                    </Portal>
                </Dialog.Root>
            )}
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
                description={
                    !isConnectedLoading && isConnected ? `Your ${config.projectDisplayName} Forum username.` : ""
                }
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
                                onClick={() => handleForumConnection()}
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
                                    <Menu.Content
                                        borderRadius={"12px"}
                                        borderWidth={2}
                                        borderColor={"contentBorder"}
                                        overflow={"hidden"}
                                        p={0}
                                        bg={"pageBackground"}
                                    >
                                        <CustomMenuItem value="connection-type" isHeading>
                                            <HStack overflow={"hidden"} color="textColorMuted">
                                                <Text fontWeight="bold">Connection Type:</Text>
                                                <Text fontWeight="bold">Test</Text>
                                            </HStack>
                                        </CustomMenuItem>
                                        <CustomMenuItem value="refresh" onClick={() => handleForumConnection()}>
                                            <HStack overflow={"hidden"}>
                                                <Text fontWeight="bold">Refresh connection</Text>
                                                <Box w="20px">
                                                    <FontAwesomeIcon icon={faRefresh} />
                                                </Box>
                                            </HStack>
                                        </CustomMenuItem>
                                        <CustomMenuItem
                                            value="disconnect"
                                            onClick={() => setIsDisconnectCheckOpen(true)}
                                        >
                                            <HStack overflow={"hidden"}>
                                                <Text fontWeight="bold" color="orange.500">
                                                    Disconnect
                                                </Text>
                                                <Box w="20px">
                                                    <FontAwesomeIcon icon={faSignOut} />
                                                </Box>
                                            </HStack>
                                        </CustomMenuItem>
                                    </Menu.Content>
                                </Menu.Positioner>
                            </Portal>
                        </Menu.Root>
                    )
                }
            />
        </>
    )
}
