"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { VStack, Text, Spinner } from "@chakra-ui/react"

import { useUser } from "../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"

import ContentContainer from "../layout/ContentContainer"
import SettingsTabbedContent from "../ui/SettingsTabbedContent"
import GeneralSettingsContainer from "./GeneralSettingsContainer"
import SuperadminStatsContainer from "./superadmin-stats/SuperadminStatsContainer"
import SignalStrengthSettingsContainer from "./signal-strength-settings/SignalStrengthSettingsContainer"
import BannersSettingsContainer from "./banner-settings/BannersSettingsContainer"

export default function ProjectSettingsContainer() {
    const { loggedInUser, loggedInUserLoading } = useUser()
    const { getAccessToken } = usePrivy()
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

    // Get all signal strengths from the database
    const [signalStrengths, setSignalStrengths] = useState<SignalStrengthData[]>([])
    const [isSignalStrengthsLoading, setIsSignalStrengthsLoading] = useState(true)

    // Lookup all signal strengths from the database
    useEffect(() => {
        const fetchSignalStrengths = async () => {
            const token = await getAccessToken()

            const response = await fetch("/api/settings/superadmin/signal-strengths", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            const data = await response.json()
            const sortedSignalStrengths = data.signalStrengths.sort((a: SignalStrengthData, b: SignalStrengthData) => {
                // First sort by status priority
                const statusPriority: Record<string, number> = { active: 0, dev: 1 }
                const aPriority = statusPriority[a.status] ?? 2
                const bPriority = statusPriority[b.status] ?? 2

                if (aPriority !== bPriority) {
                    return aPriority - bPriority
                }

                // Then sort alphabetically by display name
                return a.displayName.localeCompare(b.displayName)
            })
            setSignalStrengths(sortedSignalStrengths)
            setIsSignalStrengthsLoading(false)
        }
        fetchSignalStrengths()
    }, [getAccessToken])

    if (isLoading || isSignalStrengthsLoading) {
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
                updateUrlParam={true}
                tabs={[
                    {
                        value: "general",
                        label: "⚙️ General",
                        content: <GeneralSettingsContainer />,
                    },
                    {
                        value: "stats",
                        label: "📊 Stats",
                        content: <SuperadminStatsContainer />,
                    },
                    {
                        value: "signalStrengths",
                        label: "💯 Signals",
                        content: <SignalStrengthSettingsContainer signalStrengths={signalStrengths} />,
                    },
                    {
                        value: "banners",
                        label: "🪧 Banners",
                        content: <BannersSettingsContainer />,
                    },
                ]}
            />
        </ContentContainer>
    )
}
