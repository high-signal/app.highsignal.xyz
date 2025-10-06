"use client"

import { Text, Spinner, VStack, HStack } from "@chakra-ui/react"

import { useGetProjects } from "../../../hooks/useGetProjects"
import { useEffect, useState } from "react"
import { usePrivy } from "@privy-io/react-auth"

interface StatsData {
    totalUsers: number
    activeUsers: number
    missingDays: number
    aiRawScoreErrors: number
    lastCheckedNotNull: number
    discordRequestQueueErrors: number
}

export default function SuperadminStatsOverview() {
    const { projects, loading, error } = useGetProjects(undefined, false, true)

    const { getAccessToken } = usePrivy()

    // Get overview and error stats from the database
    const [stats, setStats] = useState<StatsData | null>(null)
    const [isStatsLoading, setIsStatsLoading] = useState(true)
    const [statsError, setStatsError] = useState<string | null>(null)

    useEffect(() => {
        const fetchStats = async () => {
            const token = await getAccessToken()
            const response = await fetch("/api/settings/superadmin/stats", {
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

    const StatsRow = ({ label, value, shouldBeZero }: { label: string; value: number; shouldBeZero?: boolean }) => {
        const isError = value > 0 && shouldBeZero

        return (
            <HStack>
                <Text>{label}:</Text>
                <Text
                    fontWeight={isError || !shouldBeZero ? "bold" : "normal"}
                    color={isError ? "red.500" : !shouldBeZero ? "green.500" : "textColorMuted"}
                >
                    {value}
                </Text>
            </HStack>
        )
    }
    return (
        <VStack alignItems="start" w={"100%"} px={3}>
            <Text fontSize="xl" fontWeight="bold">
                Overview
            </Text>
            {statsError && <Text color="red.500">{statsError}</Text>}
            {isStatsLoading ? (
                <Spinner />
            ) : (
                <VStack alignItems="start" w={"100%"} color={"textColorMuted"} gap={0}>
                    <StatsRow label="Total Users" value={stats?.totalUsers ?? 0} />
                    <StatsRow label="User Project Scores" value={stats?.activeUsers ?? 0} />
                    <StatsRow label="Total Projects" value={projects?.length ?? 0} />
                    <Text>--------------------------</Text>
                    <Text fontSize="xl" fontWeight="bold" color={"textColor"}>
                        Errors
                    </Text>
                    <StatsRow label="Missing Days" value={stats?.missingDays ?? 0} shouldBeZero />
                    <StatsRow label="AI Raw Score Errors" value={stats?.aiRawScoreErrors ?? 0} shouldBeZero />
                    <StatsRow label="Last Checked Not Null" value={stats?.lastCheckedNotNull ?? 0} shouldBeZero />
                    <StatsRow
                        label="Discord Request Queue Errors"
                        value={stats?.discordRequestQueueErrors ?? 0}
                        shouldBeZero
                    />
                </VStack>
            )}
        </VStack>
    )
}
