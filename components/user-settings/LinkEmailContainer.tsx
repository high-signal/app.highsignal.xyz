"use client"

import { useState, useEffect } from "react"
import { usePrivy, useLinkAccount } from "@privy-io/react-auth"
import { toaster } from "../ui/toaster"
import AccountConnectionManager, { AccountConnectionConfig } from "./AccountConnectionManager"
import { faEnvelope } from "@fortawesome/free-solid-svg-icons"

export default function LinkEmailContainer() {
    const { linkEmail } = useLinkAccount({
        onSuccess: ({ linkMethod }) => {
            if (linkMethod === "email") {
                setIsSubmitting(false)
                toaster.create({
                    title: "✅ Email account connected",
                    description: "Your email account has been successfully connected.",
                    type: "success",
                })
                setIsConnected(true)
                setIsConnectedLoading(false)
                setUserEmailAddress(user?.email?.address || "")
            }
        },
        onError: (error) => {
            if (isSubmitting) {
                console.error("Failed to link email:", error)
                toaster.create({
                    title: "❌ Error linking email account",
                    description: "Failed to link email account. Please try again.",
                    type: "error",
                })
                setIsSubmitting(false)
            }
        },
    })
    const { user, unlinkEmail } = usePrivy()

    const [isConnected, setIsConnected] = useState(false)
    const [isConnectedLoading, setIsConnectedLoading] = useState(true)
    const [userEmailAddress, setUserEmailAddress] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isBrokenConnection, setIsBrokenConnection] = useState(false)

    // Check if the user is connected to email
    useEffect(() => {
        const isEmailConnected = !!user?.email
        const userEmail = user?.email?.address || ""

        setIsConnected(isEmailConnected)
        setUserEmailAddress(userEmail)
        setIsConnectedLoading(false)
    }, [user])

    const handleConnect = async () => {
        setIsSubmitting(true)
        linkEmail() // redirects user to email OAuth flow
    }

    const handleDisconnect = async () => {
        try {
            setIsSubmitting(true)
            if (user?.email) {
                await unlinkEmail(user.email.address)
                setIsConnected(false)
                setUserEmailAddress("")
                toaster.create({
                    title: "✅ Email account disconnected",
                    description: "Your email account has been successfully disconnected.",
                    type: "success",
                })
            } else {
                throw new Error("No email account found to disconnect")
            }
        } catch (err) {
            console.error("Failed to unlink email:", err)
            toaster.create({
                title: "❌ Error disconnecting email account",
                description: "Failed to disconnect email account. Please try again.",
                type: "error",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    // Create the account connection config
    const accountConnectionConfig: AccountConnectionConfig = {
        displayName: "Email",
        urlSlug: "email",
        logoUrl: "",
        logoIcon: faEnvelope,
        apiEndpoints: {
            authRequest: "", // TODO
            authProcess: "", // TODO
            disconnect: "", // TODO
        },
        successMessages: {
            connected: `✅ Email account connected`,
            disconnected: "✅ Email account disconnected",
        },
        errorMessages: {
            authRequest: "Failed to link email account",
            authProcess: "Failed to process email authentication",
            disconnect: "Failed to disconnect email account",
        },
    }

    const getConnectionDescription = () => {
        return !isConnectedLoading && isConnected ? `Your email address.` : ""
    }

    return (
        <AccountConnectionManager
            config={accountConnectionConfig}
            isConnected={isConnected}
            isConnectedLoading={isConnectedLoading}
            connectionValue={userEmailAddress}
            isSubmitting={isSubmitting}
            isBrokenConnection={isBrokenConnection}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            getConnectionDescription={getConnectionDescription}
        />
    )
}
