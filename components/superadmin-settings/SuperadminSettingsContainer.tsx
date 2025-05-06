"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { VStack, Text, Spinner } from "@chakra-ui/react"

import { useUser } from "../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"

import ContentContainer from "../layout/ContentContainer"
import GeneralSettingsContainer from "./GeneralSettingsContainer"
import SignalStrengthSettingsContainer from "./SignalStrengthSettingsContainer"
import SettingsTabbedContent from "../ui/SettingsTabbedContent"

export default function ProjectSettingsContainer() {
    const { loggedInUser, loggedInUserLoading } = useUser()
    const { getAccessToken } = usePrivy()
    const params = useParams()
    const router = useRouter()

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Get super admin settings data
    useEffect(() => {
        const fetchUserData = async () => {
            if (!loggedInUser) {
                setIsLoading(false)
                setError("Please log in to access super admin settings")
                return
            }

            try {
                const token = await getAccessToken()
                const response = await fetch(`/api/settings/superadmin`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    console.error("Failed to fetch super admin settings data:", errorData)
                    throw new Error(errorData.error || "Failed to fetch super admin settings data")
                }
            } catch (err) {
                console.error("Error in fetchSuperAdminSettings:", err)
                setError(err instanceof Error ? err.message : "An error occurred")
            } finally {
                setIsLoading(false)
            }
        }

        if (!loggedInUserLoading) {
            fetchUserData()
        }
    }, [loggedInUser, loggedInUserLoading, getAccessToken, router])

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

    return (
        <ContentContainer>
            <SettingsTabbedContent
                title="Super Admin Settings"
                defaultValue="general"
                tabs={[
                    {
                        value: "general",
                        label: "General",
                        content: <GeneralSettingsContainer />,
                    },
                    {
                        value: "signal",
                        label: "Signal Strengths",
                        content: <SignalStrengthSettingsContainer />,
                    },
                ]}
            />
        </ContentContainer>
    )
}
