"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Text, Button, Spinner, Menu, Portal, HStack, Box, Image, Skeleton } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEllipsisVertical, faRefresh, faSignOut } from "@fortawesome/free-solid-svg-icons"

import { useUser } from "../../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"

import { toaster } from "../../ui/toaster"
import SettingsInputField from "../../ui/SettingsInputField"
import ConnectTypeSelectorModal from "./ConnectTypeSelectorModal"
import DisconnectCheckModal from "./DisconnectCheckModal"

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
        forumAuthTypes: string[] | undefined
        forumAuthParentPostUrl: string | undefined
    }
}) {
    const { refreshUser } = useUser()
    const { getAccessToken } = usePrivy()
    const router = useRouter()

    const signalStrengthName = "discourse_forum"

    const [isConnected, setIsConnected] = useState(false)
    const [isConnectedLoading, setIsConnectedLoading] = useState(true)
    const [forumUsername, setForumUsername] = useState("")
    const [isForumSubmitting, setIsForumSubmitting] = useState(false)
    const [isProcessingForumAuthRequest, setIsProcessingForumAuthRequest] = useState(false)

    const [isConnectTypeSelectorOpen, setIsConnectTypeSelectorOpen] = useState(false)
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
        const urlParams = new URLSearchParams(window.location.search)
        const type = urlParams.get("type")
        const project = urlParams.get("project")
        const payload = urlParams.get("payload")

        const processForumAuthRequest = async () => {
            setIsForumSubmitting(true)

            // Post the payload, target username, and project url slug to the route
            const token = await getAccessToken()
            const forumResponse = await fetch(
                `/api/settings/u/accounts/forum_users/auth/api_auth?username=${targetUser.username}&project=${config.projectUrlSlug}`,
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
                title: `✅ ${config.projectDisplayName} forum connected`,
                description: `Your ${config.projectDisplayName} forum accounts has been connected successfully. View your ${config.projectDisplayName} signal score to see the calculation in progress.`,
                type: "success",
                action: {
                    label: `View your ${config.projectDisplayName} signal score`,
                    onClick: () =>
                        router.push(`/p/${config.projectUrlSlug}/${targetUser?.username}#${signalStrengthName}`),
                },
            })
        }

        if (!isProcessingForumAuthRequest && type && project === config.projectUrlSlug && payload) {
            setIsProcessingForumAuthRequest(true)
            processForumAuthRequest()
        }
    }, [config, getAccessToken, refreshUser, router, targetUser, isProcessingForumAuthRequest])

    const handleForumAuthApi = async () => {
        try {
            setIsForumSubmitting(true)

            const token = await getAccessToken()
            const authRequestResponse = await fetch(
                `/api/settings/u/accounts/forum_users/auth/api_auth?username=${targetUser.username}&project=${config.projectUrlSlug}`,
                {
                    method: "PUT",
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

    function checkAuthTypes() {
        if (config.forumAuthTypes?.length == 1 && config.forumAuthTypes[0] === "api_auth") {
            // If "api_auth" is the only auth type, use the api auth immediately
            handleForumAuthApi()
        } else {
            setIsConnectTypeSelectorOpen(true)
        }
    }

    const handleForumDisconnect = async () => {
        try {
            setIsForumSubmitting(true)
            setIsConnected(false)
            setIsProcessingForumAuthRequest(false)

            // Call the forum_users DELETE route
            const token = await getAccessToken()
            const forumResponse = await fetch(
                `/api/settings/u/accounts/forum_users?username=${targetUser?.username}&project=${config.projectUrlSlug}`,
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
            <ConnectTypeSelectorModal
                isOpen={isConnectTypeSelectorOpen}
                onClose={() => setIsConnectTypeSelectorOpen(false)}
                config={config}
                targetUser={targetUser}
                isForumSubmitting={isForumSubmitting}
                handleForumAuthApi={handleForumAuthApi}
            />
            <DisconnectCheckModal
                isOpen={isDisconnectCheckOpen}
                onClose={() => setIsDisconnectCheckOpen(false)}
                onDisconnect={handleForumDisconnect}
                projectDisplayName={config.projectDisplayName}
            />
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
                                onClick={checkAuthTypes}
                                borderRadius="full"
                                disabled={
                                    isForumSubmitting || isConnectTypeSelectorOpen || isProcessingForumAuthRequest
                                }
                            >
                                {isForumSubmitting || isConnectTypeSelectorOpen || isProcessingForumAuthRequest ? (
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
                                            <HStack overflow={"hidden"} color="textColorMuted" gap={1}>
                                                <Text fontWeight="bold">Username from</Text>
                                                <Text fontWeight="bold">
                                                    {targetUser.forumUsers?.find(
                                                        (forumUser) =>
                                                            forumUser.projectUrlSlug === config.projectUrlSlug,
                                                    )?.authEncryptedPayload
                                                        ? "direct connection"
                                                        : targetUser.forumUsers?.find(
                                                                (forumUser) =>
                                                                    forumUser.projectUrlSlug === config.projectUrlSlug,
                                                            )?.authPostId
                                                          ? "public post"
                                                          : "None"}
                                                </Text>
                                            </HStack>
                                        </CustomMenuItem>
                                        <CustomMenuItem value="refresh" onClick={checkAuthTypes}>
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
