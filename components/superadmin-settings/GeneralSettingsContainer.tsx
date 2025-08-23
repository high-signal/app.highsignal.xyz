"use client"

import { Text, Spinner, VStack, Button, Image, HStack } from "@chakra-ui/react"

import Link from "next/link"

import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import { useGetProjects } from "../../hooks/useGetProjects"
import { useEffect, useState } from "react"
import { usePrivy } from "@privy-io/react-auth"

interface StatsData {
    totalUsers: number
    missingDays: number
    aiRawScoreErrors: number
    lastCheckedNotNull: number
}

export default function GeneralSettingsContainer() {
    const { projects, loading, error } = useGetProjects(undefined, false, true)

    const { getAccessToken } = usePrivy()

    // Get stats from the database
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
                console.log("data.data", data.data)
                setStats(data.data)
                setStatsError(null)
            } else {
                console.error(data.error)
                setStatsError("Error fetching stats: " + data.error)
            }
            setIsStatsLoading(false)
        }
        fetchStats()
    }, [])

    return (
        <SettingsSectionContainer>
            <VStack alignItems="start" w={"100%"} px={3}>
                <Text fontSize="xl" fontWeight="bold">
                    Stats
                </Text>
                {statsError && <Text color="red.500">{statsError}</Text>}
                {isStatsLoading ? (
                    <Spinner />
                ) : (
                    <VStack alignItems="start" w={"100%"} color={"textColorMuted"}>
                        <Text>Total Users: {stats?.totalUsers}</Text>
                        <Text>Missing Days: {stats?.missingDays} --- (hopefully 0)</Text>
                        <Text>AI Raw Score Errors: {stats?.aiRawScoreErrors} --- (hopefully 0)</Text>
                        <Text>Last Checked Not Null: {stats?.lastCheckedNotNull} --- (hopefully 0)</Text>
                    </VStack>
                )}
            </VStack>
            <VStack alignItems="start" w={"100%"} px={3}>
                <Text fontSize="xl" fontWeight="bold">
                    Project Settings Links
                </Text>
                {loading && <Spinner />}
                {error && <Text>Error loading projects</Text>}
                {!loading &&
                    projects &&
                    projects.length > 0 &&
                    projects.map((project: ProjectData) => (
                        <Link href={`/settings/p/${project.urlSlug}`} key={project.urlSlug} style={{ width: "100%" }}>
                            <Button
                                secondaryButton
                                p={2}
                                pr={3}
                                borderRadius="full"
                                bg="pageBackground"
                                border="3px solid"
                                borderColor="contentBorder"
                                justifyContent="start"
                                _hover={{
                                    bg: "button.secondary.default",
                                }}
                                w={"100%"}
                            >
                                <HStack w={"100%"} justifyContent="space-between" flexWrap="wrap">
                                    <HStack>
                                        <Image
                                            src={project.projectLogoUrl}
                                            alt={project.displayName}
                                            boxSize="25px"
                                            borderRadius="full"
                                        />
                                        <Text fontSize="lg">{project.displayName}</Text>
                                    </HStack>
                                    {project.signalStrengths.length === 0 && (
                                        <Text color="red.500" fontSize="sm" ml={1}>
                                            (No Signals Strengths enabled)
                                        </Text>
                                    )}
                                </HStack>
                            </Button>
                        </Link>
                    ))}
            </VStack>
            <VStack alignItems="start" w={"100%"} px={3}>
                <Text fontSize="xl" fontWeight="bold">
                    Other Links
                </Text>
                <Link href={`/testing`}>
                    <Button secondaryButton px={3} py={1} borderRadius="full" fontWeight="bold">
                        Bubble Display
                    </Button>
                </Link>
            </VStack>
        </SettingsSectionContainer>
    )
}
