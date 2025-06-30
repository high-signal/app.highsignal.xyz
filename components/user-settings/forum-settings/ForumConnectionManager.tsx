"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "../../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"

import { toaster } from "../../ui/toaster"
import AccountConnectionManager, { AccountConnectionConfig } from "../AccountConnectionManager"
import ConnectTypeSelectorModal from "./ConnectTypeSelectorModal"
import DisconnectConfirmationModal from "./../DisconnectConfirmationModal"

export default function ForumConnectionManager({
    targetUser,
    config,
    disabled,
    lozengeTypes,
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
    disabled: boolean
    lozengeTypes?: ("public" | "private" | "comingSoon" | "notifications" | "score")[]
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
    const [isBrokenConnection, setIsBrokenConnection] = useState(false)

    // Check if the user is connected to the forum
    useEffect(() => {
        const forumUser = targetUser.forumUsers?.find((forumUser) => forumUser.projectUrlSlug === config.projectUrlSlug)
        const forumUsername = forumUser?.forumUsername

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
                title: `✅ ${config.projectDisplayName} forum ownership confirmed`,
                description: `Your ${config.projectDisplayName} forum account ownership has been confirmed. View your ${config.projectDisplayName} signal score to see the calculation in progress.`,
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

            // Add timeout to ensure loading state is cleared after 10 seconds
            const timeoutId = setTimeout(() => {
                setIsForumSubmitting(false)
            }, 10000)

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

            // Clear the timeout since we got a response
            clearTimeout(timeoutId)

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

    // Handle the edge case where an auth option was disabled after a
    // user connected with it by displaying a message to the user
    useEffect(() => {
        const forumUser = targetUser.forumUsers?.find((forumUser) => forumUser.projectUrlSlug === config.projectUrlSlug)
        if (forumUser?.forumUsername && !forumUser?.authPostId && !forumUser?.authEncryptedPayload) {
            setIsBrokenConnection(true)
        } else {
            setIsBrokenConnection(false)
        }
    }, [targetUser, config, isConnected])

    // Create the account connection config
    const accountConnectionConfig: AccountConnectionConfig = {
        displayName: config.projectDisplayName,
        urlSlug: config.projectUrlSlug,
        logoUrl: config.projectLogoUrl,
        connectionType: "Forum",
        apiEndpoints: {
            authRequest: `/api/settings/u/accounts/forum_users/auth/api_auth?username=${targetUser.username}&project=${config.projectUrlSlug}`,
            authProcess: `/api/settings/u/accounts/forum_users/auth/api_auth?username=${targetUser.username}&project=${config.projectUrlSlug}`,
            disconnect: `/api/settings/u/accounts/forum_users?username=${targetUser?.username}&project=${config.projectUrlSlug}`,
        },
        successMessages: {
            connected: `✅ ${config.projectDisplayName} forum ownership confirmed`,
            disconnected: "✅ Forum account disconnected",
        },
        errorMessages: {
            authRequest: "Failed to get forum user auth URL",
            authProcess: "Failed to process forum auth request",
            disconnect: "Failed to disconnect forum username",
        },
    }

    const getConnectionTypeText = () => {
        const forumUser = targetUser.forumUsers?.find((forumUser) => forumUser.projectUrlSlug === config.projectUrlSlug)

        if (forumUser?.authEncryptedPayload) {
            return "Username from automatic check"
        } else if (forumUser?.authPostId) {
            return "Username from public post"
        } else {
            return "Please refresh connection"
        }
    }

    const getConnectionDescription = () => {
        return !isConnectedLoading && isConnected ? `Your ${config.projectDisplayName} forum username.` : ""
    }

    const handleConnect = () => {
        setIsConnectTypeSelectorOpen(true)
    }

    const handleDisconnect = () => {
        setIsDisconnectCheckOpen(true)
    }

    const handleRefresh = () => {
        setIsConnectTypeSelectorOpen(true)
    }

    return (
        <AccountConnectionManager
            config={accountConnectionConfig}
            isConnected={isConnected}
            isConnectedLoading={isConnectedLoading}
            connectionValue={forumUsername}
            isSubmitting={isForumSubmitting}
            isProcessingAuthRequest={isProcessingForumAuthRequest}
            isBrokenConnection={isBrokenConnection}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onRefresh={handleRefresh}
            getConnectionTypeText={getConnectionTypeText}
            getConnectionDescription={getConnectionDescription}
            disabled={disabled}
            lozengeTypes={lozengeTypes}
        >
            <ConnectTypeSelectorModal
                isOpen={isConnectTypeSelectorOpen}
                onClose={() => setIsConnectTypeSelectorOpen(false)}
                config={config}
                targetUser={targetUser}
                isForumSubmitting={isForumSubmitting}
                handleForumAuthApi={handleForumAuthApi}
            />
            <DisconnectConfirmationModal
                isOpen={isDisconnectCheckOpen}
                onClose={() => setIsDisconnectCheckOpen(false)}
                onConfirm={() => handleForumDisconnect()}
                name={`${config.projectDisplayName} forum`}
                refreshConnectionOption={true}
            />
        </AccountConnectionManager>
    )
}
