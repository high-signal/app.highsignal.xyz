"use client"

import { useState, useEffect } from "react"
import { usePrivy, useLinkAccount, getAccessToken } from "@privy-io/react-auth"
import { toaster } from "../ui/toaster"
import { FontAwesomeIconProps } from "@fortawesome/react-fontawesome"

import AccountConnectionManager, { AccountConnectionConfig } from "./AccountConnectionManager"
import GenericConfirmModal from "./DisconnectConfirmationModal"

export interface LinkPrivyAccountsContainerProps {
    targetUser: UserData
    accountConfig: {
        type: string
        displayName: string
        logoIcon: FontAwesomeIconProps["icon"]
        confirmDelete?: boolean
        privyLinkMethod: string
    }
    disabled?: boolean
}

export default function LinkPrivyAccountsContainer({
    targetUser,
    accountConfig,
    disabled = false,
}: LinkPrivyAccountsContainerProps) {
    // **********************************
    // ADD ADDITIONAL ACCOUNT TYPES HERE
    // **********************************
    const { linkEmail, linkDiscord, linkTwitter, linkFarcaster, linkGithub, linkGoogle, linkTelegram } = useLinkAccount(
        {
            onSuccess: async ({ linkMethod }) => {
                if (linkMethod === accountConfig.privyLinkMethod) {
                    // Call the API to update the Privy accounts
                    const token = await getAccessToken()
                    await fetch(`/api/settings/u/accounts/privy-accounts?username=${targetUser.username}`, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    })

                    setIsSubmitting(false)
                    toaster.create({
                        title: `✅ ${accountConfig.displayName} Account ownership confirmed`,
                        description: `You have successfully confirmed ownership of your ${accountConfig.displayName} account.`,
                        type: "success",
                    })
                    setIsConnected(true)
                    setIsConnectedLoading(false)
                }
            },
            onError: (error) => {
                if (isSubmitting) {
                    console.error(`Failed to link ${accountConfig.type}:`, error)
                    toaster.create({
                        title: `❌ Error confirming ${accountConfig.displayName} account`,
                        description: `Failed to confirm ownership of your ${accountConfig.displayName} account. Please try again.`,
                        type: "error",
                    })
                    setIsSubmitting(false)
                }
            },
        },
    )

    // **********************************
    // ADD ADDITIONAL ACCOUNT TYPES HERE
    // **********************************
    const {
        user: privyUser,
        unlinkEmail,
        unlinkDiscord,
        unlinkTwitter,
        unlinkFarcaster,
        unlinkGithub,
        unlinkGoogle,
        unlinkTelegram,
    } = usePrivy()

    const [isConnected, setIsConnected] = useState(false)
    const [isConnectedLoading, setIsConnectedLoading] = useState(true)
    const [accountUsername, setAccountUsername] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showConfirmDelete, setShowConfirmDelete] = useState(false)

    // Check if the user is connected to the account type
    useEffect(() => {
        if (targetUser[accountConfig.type as keyof UserData]) {
            setIsConnected(true)
            if (accountConfig.type === "discordUsername") {
                setAccountUsername((targetUser[accountConfig.type as keyof UserData] as string).split("#")[0])
            } else {
                setAccountUsername(targetUser[accountConfig.type as keyof UserData] as string)
            }
            setIsConnectedLoading(false)
        } else {
            setIsConnected(false)
            setIsConnectedLoading(false)
        }
    }, [targetUser, accountConfig.type])

    // Handle account connection
    const handleConnect = async () => {
        setIsSubmitting(true)
        // **********************************
        // ADD ADDITIONAL ACCOUNT TYPES HERE
        // **********************************
        if (accountConfig.type === "email") {
            linkEmail()
        }
        if (accountConfig.type === "discordUsername") {
            linkDiscord()
        }
        if (accountConfig.type === "xUsername") {
            linkTwitter()
        }
        if (accountConfig.type === "farcasterUsername") {
            linkFarcaster()
        }
        if (accountConfig.type === "githubUsername") {
            linkGithub()
        }
        if (accountConfig.type === "google") {
            linkGoogle()
        }
        if (accountConfig.type === "telegramUsername") {
            linkTelegram()
        }
    }

    const handleDisconnect = async () => {
        // Show confirmation dialog if configured
        if (accountConfig.confirmDelete) {
            setShowConfirmDelete(true)
            return
        }

        await performDisconnect()
    }

    const performDisconnect = async () => {
        try {
            setIsSubmitting(true)
            // **********************************
            // ADD ADDITIONAL ACCOUNT TYPES HERE
            // **********************************
            if (accountConfig.type === "email" && privyUser?.email?.address) {
                await unlinkEmail(privyUser.email.address)
            } else if (accountConfig.type === "discordUsername" && privyUser?.discord?.subject) {
                await unlinkDiscord(privyUser.discord.subject)
            } else if (accountConfig.type === "xUsername" && privyUser?.twitter?.subject) {
                console.log("privyUser.twitter.subject", privyUser.twitter.subject)
                await unlinkTwitter(privyUser.twitter.subject)
            } else if (accountConfig.type === "farcasterUsername" && privyUser?.farcaster?.fid) {
                await unlinkFarcaster(privyUser.farcaster.fid as number)
                // } else if (accountConfig.type === "githubUsername" && privyUser?.github?.subject) {
                //     await unlinkGithub(privyUser.github.subject)
                // } else if (accountConfig.type === "google" && privyUser?.google?.subject) {
                //     await unlinkGoogle(privyUser.google.subject)
                // } else if (accountConfig.type === "telegramUsername" && privyUser?.telegram?.subject) {
                //     await unlinkTelegram(privyUser.telegram.subject)
            } else {
                throw new Error(`No ${accountConfig.type} account found to remove`)
            }

            // Call the API to update the Privy accounts
            const token = await getAccessToken()
            await fetch(`/api/settings/u/accounts/privy-accounts?username=${targetUser.username}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            setIsConnected(false)
            toaster.create({
                title: `✅ ${accountConfig.displayName.charAt(0).toUpperCase() + accountConfig.displayName.slice(1)} account has been removed`,
                description: `Your ${accountConfig.displayName} account has been successfully removed.`,
                type: "success",
            })
        } catch (err) {
            console.error(`Failed to remove ${accountConfig.type}:`, err)
            toaster.create({
                title: `❌ Error removing ${accountConfig.displayName} account`,
                description: `Failed to remove your ${accountConfig.displayName} account. Please try again.`,
                type: "error",
            })
        } finally {
            setIsSubmitting(false)
            setShowConfirmDelete(false)
        }
    }

    // Create the account connection config
    const accountConnectionConfig: AccountConnectionConfig = {
        displayName: accountConfig.displayName,
        urlSlug: accountConfig.type,
        logoIcon: accountConfig.logoIcon,
        connectionType: accountConfig.type,
        successMessages: {
            connected: `✅ ${accountConfig.displayName} account ownership confirmed`,
            disconnected: `✅ ${accountConfig.displayName} account has been removed`,
        },
        errorMessages: {
            authRequest: `Failed to confirm ownership of your ${accountConfig.displayName} account`,
            authProcess: `Failed to process ${accountConfig.displayName} authentication`,
            disconnect: `Failed to remove your ${accountConfig.displayName} account`,
        },
    }

    return (
        <>
            <AccountConnectionManager
                config={accountConnectionConfig}
                isConnected={isConnected}
                isConnectedLoading={isConnectedLoading}
                connectionValue={accountUsername}
                isSubmitting={isSubmitting}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                getConnectionDescription={() => {
                    return !isConnectedLoading && isConnected ? `Your ${accountConfig.displayName} account.` : ""
                }}
                disabled={disabled}
            />

            {accountConfig.confirmDelete && (
                <GenericConfirmModal
                    name={accountConfig.displayName}
                    isOpen={showConfirmDelete}
                    onClose={() => setShowConfirmDelete(false)}
                    onConfirm={() => performDisconnect()}
                />
            )}
        </>
    )
}
