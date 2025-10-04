"use client"

import { Text, Spinner, VStack, Button, Image, HStack } from "@chakra-ui/react"

import Link from "next/link"

import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import CreateNewProjectModal from "./CreateNewProjectModal"
import { useGetProjects } from "../../hooks/useGetProjects"
import { useEffect, useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { ASSETS } from "../../config/constants"

interface StatsData {
    totalUsers: number
    activeUsers: number
    missingDays: number
    aiRawScoreErrors: number
    lastCheckedNotNull: number
    discordRequestQueueErrors: number
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

    // Create new project modal
    const [isCreateNewProjectModalOpen, setIsCreateNewProjectModalOpen] = useState(false)

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
        <>
            <SettingsSectionContainer>
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
                            <StatsRow
                                label="Last Checked Not Null"
                                value={stats?.lastCheckedNotNull ?? 0}
                                shouldBeZero
                            />
                            <StatsRow
                                label="Discord Request Queue Errors"
                                value={stats?.discordRequestQueueErrors ?? 0}
                                shouldBeZero
                            />
                        </VStack>
                    )}
                </VStack>
                <VStack alignItems="start" w={"100%"} px={3}>
                    <Text fontSize="xl" fontWeight="bold">
                        Project Settings Links
                    </Text>
                    <Button
                        primaryButton
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontWeight="bold"
                        onClick={() => setIsCreateNewProjectModalOpen(true)}
                    >
                        Create New Project
                    </Button>
                    {loading && <Spinner />}
                    {error && <Text>Error loading projects</Text>}
                    {!loading &&
                        projects &&
                        projects.length > 0 &&
                        projects.map((project: ProjectData) => (
                            <Link
                                href={`/settings/p/${project.urlSlug}`}
                                key={project.urlSlug}
                                style={{ width: "100%" }}
                            >
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
                                                src={project.projectLogoUrl || ASSETS.DEFAULT_PROJECT_IMAGE}
                                                alt={project.displayName}
                                                boxSize="25px"
                                                borderRadius="full"
                                            />
                                            <Text fontSize="lg">{project.displayName}</Text>
                                        </HStack>
                                        {project.signalStrengths.length === 0 && (
                                            <Text color="red.500" fontSize="sm" ml={1}>
                                                (No Signals Strengths configured in DB)
                                            </Text>
                                        )}
                                        {project?.signalStrengths?.length > 0 &&
                                            !project?.signalStrengths?.some((ss) => ss.enabled === true) && (
                                                <Text color="red.500" fontSize="sm" ml={1}>
                                                    (No Signals enabled)
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
            <CreateNewProjectModal
                isOpen={isCreateNewProjectModalOpen}
                onClose={() => setIsCreateNewProjectModalOpen(false)}
            />
        </>
    )
}
