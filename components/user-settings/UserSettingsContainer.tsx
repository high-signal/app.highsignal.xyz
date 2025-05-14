"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { VStack, Text, Spinner } from "@chakra-ui/react"

import { useUser } from "../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"

import ContentContainer from "../layout/ContentContainer"
import ConnectedAccountsContainer from "./ConnectedAccountsContainer"
import GeneralSettingsContainer from "./GeneralSettingsContainer"
import SettingsTabbedContent from "../ui/SettingsTabbedContent"

export default function UserSettingsContainer() {
    const { loggedInUser, loggedInUserLoading, refreshUser } = useUser()
    const { getAccessToken } = usePrivy()
    const params = useParams()
    const router = useRouter()
    const [targetUser, setTargetUser] = useState<UserData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Get user data
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

    if (isLoading) {
        return (
            <ContentContainer>
                <VStack gap={10} w="100%" minH="300px" justifyContent="center" alignItems="center" borderRadius="20px">
                    <Spinner size="lg" />
                </VStack>
            </ContentContainer>
        )
    }

    if (error) {
        return (
            <ContentContainer>
                <VStack>
                    <Text color="orange.700">{error}</Text>
                </VStack>
            </ContentContainer>
        )
    }

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
            <SettingsTabbedContent
                title="User Settings"
                tabs={[
                    {
                        value: "general",
                        label: "General",
                        content: <GeneralSettingsContainer targetUser={targetUser} />,
                    },
                    {
                        value: "connected-accounts",
                        label: "Connected Accounts",
                        content: <ConnectedAccountsContainer targetUser={targetUser} />,
                    },
                ]}
            />
        </ContentContainer>
    )
}
