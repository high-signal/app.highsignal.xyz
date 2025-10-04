"use client"

import { useState, useEffect } from "react"
import { HStack, Spinner, Text, VStack } from "@chakra-ui/react"

import SettingsSectionContainer from "../../ui/SettingsSectionContainer"
import { usePrivy } from "@privy-io/react-auth"

interface StatsData {
    lambdaStatsDaily: number
    aiStatsDaily: number
}

export default function SuperadminStatsContainer() {
    const { getAccessToken } = usePrivy()

    const [stats, setStats] = useState<StatsData | null>(null)
    const [isStatsLoading, setIsStatsLoading] = useState(true)
    const [statsError, setStatsError] = useState<string | null>(null)

    useEffect(() => {
        const fetchStats = async () => {
            const token = await getAccessToken()
            const response = await fetch("/api/settings/superadmin/stats-history", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            const data = await response.json()

            if (data.status === "success") {
                setStats(data.data)
                setStatsError(null)
            } else {
                console.error(data.error)
                setStatsError("Error fetching stats: " + data.error)
            }
            setIsStatsLoading(false)
        }
        fetchStats()
    }, [getAccessToken])

    return (
        <SettingsSectionContainer maxWidth="100%">
            <HStack w={"100%"} bg="green">
                {isStatsLoading ? <Spinner /> : <Text>{JSON.stringify(stats)}</Text>}
            </HStack>
        </SettingsSectionContainer>
    )
}
