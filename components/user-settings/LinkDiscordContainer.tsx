"use client"

import { useState, useEffect } from "react"
import { usePrivy, useLinkAccount } from "@privy-io/react-auth"
import { toaster } from "../ui/toaster"
import AccountConnectionManager, { AccountConnectionConfig } from "./AccountConnectionManager"
import DisconnectCheckModal from "./forum-settings/DisconnectCheckModal"
import { faDiscord } from "@fortawesome/free-brands-svg-icons"

export default function LinkDiscordContainer() {
    const { linkDiscord } = useLinkAccount()
    const { user, unlinkDiscord } = usePrivy()

    const [isConnected, setIsConnected] = useState(false)
    const [isConnectedLoading, setIsConnectedLoading] = useState(true)
    const [discordUsername, setDiscordUsername] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isBrokenConnection, setIsBrokenConnection] = useState(false)
    const [isDisconnectCheckOpen, setIsDisconnectCheckOpen] = useState(false)

    const signalStrengthName = "discord_engagement"

    // Check if the user is connected to Discord
    useEffect(() => {
        const isDiscordConnected = !!user?.discord?.username
        const username = user?.discord?.username || ""

        setIsConnected(isDiscordConnected)
        setDiscordUsername(username)
        setIsConnectedLoading(false)
    }, [user])

    const handleConnect = async () => {
        try {
            setIsSubmitting(true)
            linkDiscord() // redirects user to Discord OAuth flow
        } catch (err) {
            console.error("Failed to link Discord:", err)
            setIsSubmitting(false)
            toaster.create({
                title: "❌ Error linking Discord account",
                description: "Failed to link Discord account. Please try again.",
                type: "error",
            })
        }
    }

    const handleDisconnect = async () => {
        try {
            setIsSubmitting(true)
            if (user?.discord?.subject) {
                await unlinkDiscord(user.discord.subject)
                setIsConnected(false)
                setDiscordUsername("")
                toaster.create({
                    title: "✅ Discord account disconnected",
                    description: "Your Discord account has been successfully disconnected.",
                    type: "success",
                })
            } else {
                throw new Error("No Discord account found to disconnect")
            }
        } catch (err) {
            console.error("Failed to unlink Discord:", err)
            toaster.create({
                title: "❌ Error disconnecting Discord account",
                description: "Failed to disconnect Discord account. Please try again.",
                type: "error",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRefresh = async () => {
        // TODO: Handle Discord username refresh in the DB
    }

    const handleDisconnectWithModal = () => {
        setIsDisconnectCheckOpen(true)
    }

    // Create the account connection config
    const accountConnectionConfig: AccountConnectionConfig = {
        displayName: "Discord",
        urlSlug: "discord",
        logoUrl: "faDiscord",
        logoIcon: faDiscord,
        signalStrengthName,
        apiEndpoints: {
            authRequest: "", // TODO
            authProcess: "", // TODO
            disconnect: "", // TODO
        },
        successMessages: {
            connected: `✅ Discord account connected`,
            disconnected: "✅ Discord account disconnected",
        },
        errorMessages: {
            authRequest: "Failed to link Discord account",
            authProcess: "Failed to process Discord authentication",
            disconnect: "Failed to disconnect Discord account",
        },
    }

    const getConnectionTypeText = () => {
        if (user?.discord?.username) {
            return "Username from Discord OAuth"
        } else {
            return "Please connect Discord account"
        }
    }

    const getConnectionDescription = () => {
        return !isConnectedLoading && isConnected ? `Your Discord username.` : ""
    }

    return (
        <AccountConnectionManager
            config={accountConnectionConfig}
            isConnected={isConnected}
            isConnectedLoading={isConnectedLoading}
            connectionValue={discordUsername.split("#")[0]}
            isSubmitting={isSubmitting}
            isBrokenConnection={isBrokenConnection}
            onConnect={handleConnect}
            onDisconnect={handleDisconnectWithModal}
            onRefresh={handleRefresh}
            getConnectionTypeText={getConnectionTypeText}
            getConnectionDescription={getConnectionDescription}
        >
            <DisconnectCheckModal
                isOpen={isDisconnectCheckOpen}
                onClose={() => setIsDisconnectCheckOpen(false)}
                onDisconnect={handleDisconnect}
                projectDisplayName="Discord"
            />
        </AccountConnectionManager>
    )
}
