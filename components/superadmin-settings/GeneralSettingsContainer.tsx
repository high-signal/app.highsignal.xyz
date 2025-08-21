"use client"

import { Text, Spinner, VStack, Button, Image, HStack } from "@chakra-ui/react"

import Link from "next/link"

import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import { useGetProjects } from "../../hooks/useGetProjects"

export default function GeneralSettingsContainer() {
    const { projects, loading, error } = useGetProjects(undefined, false, true)

    return (
        <SettingsSectionContainer>
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
