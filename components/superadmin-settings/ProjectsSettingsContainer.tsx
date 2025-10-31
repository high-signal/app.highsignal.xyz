"use client"

import { Text, Spinner, VStack, Button, Image, HStack } from "@chakra-ui/react"

import Link from "next/link"

import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import CreateNewProjectModal from "./CreateNewProjectModal"
import { useGetProjects } from "../../hooks/useGetProjects"
import { useState } from "react"
import { ASSETS } from "../../config/constants"

interface StatsData {
    totalUsers: number
    activeUsers: number
    missingDays: number
    aiRawScoreErrors: number
    lastCheckedNotNull: number
    discordRequestQueueErrors: number
}

export default function ProjectsSettingsContainer() {
    const { projects, loading, error } = useGetProjects(undefined, false, true)

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
                    {error && <Text color="red.500">Error loading projects</Text>}
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
