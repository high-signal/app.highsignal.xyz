"use client"

import { VStack, Text, HStack, Skeleton, Spinner, Box } from "@chakra-ui/react"
import Leaderboard from "./Leaderboard"
import { useGetProjects } from "../../hooks/useGetProjects"
import AcmeIncPlaceholder from "../ui/AcmeIncPlaceholder"
import SignalIndicator from "../ui/SignalIndicator"
import { faDiscord, faDiscourse } from "@fortawesome/free-brands-svg-icons"

import Title from "../signal-display/Title"
import UserSignalDotsBar from "../ui/UserSignalDotsBar"

export default function LeaderboardContainer({ project }: { project: string }) {
    const { projects, loading, error } = useGetProjects(project)

    const currentProject = projects[0]

    // Display placeholder for example project
    if (currentProject?.urlSlug === "acme-inc") {
        return <AcmeIncPlaceholder projectData={currentProject} />
    }

    // If no project is found, return a message
    if (!currentProject && !loading) {
        return (
            <VStack
                mt={10}
                gap={3}
                textAlign="center"
                bg={"contentBackground"}
                px={5}
                py={3}
                borderRadius="20px"
                border={"3px solid"}
                borderColor={"contentBorder"}
            >
                <Text>This project may not exist or may need more configuration.</Text>
                <Text>If you are the project owner, please check your project settings.</Text>
            </VStack>
        )
    }

    return (
        <VStack gap={0} w="100%" maxW="650px" borderRadius="20px">
            <VStack fontSize="3xl" px={6} w="100%" textAlign="center" gap={10} flexWrap="wrap" justifyContent="center">
                {!loading && !error ? (
                    <VStack gap={5}>
                        <Title projectData={currentProject} allLeaderboards linkUrl={currentProject?.website} />
                        <VStack bg={"contentBackground"} p={4} borderRadius={"32px"} fontSize="md" gap={5}>
                            <Text fontSize="md" wordBreak="break-word">
                                {currentProject?.description}
                            </Text>
                            <UserSignalDotsBar
                                highCount={currentProject.highSignalUsers || 0}
                                midCount={currentProject.midSignalUsers || 0}
                                showLabels={true}
                                heightPx={50}
                            />
                            <HStack
                                flexWrap="wrap"
                                justifyContent="space-around"
                                w="100%"
                                columnGap={5}
                                rowGap={2}
                                fontSize="md"
                                bg={"pageBackground"}
                                pl={3}
                                pr={2}
                                py={2}
                                borderRadius={"32px"}
                            >
                                <Text fontWeight="bold">Signals used by {currentProject?.displayName}</Text>
                                <HStack gap={{ base: 2, md: 5 }} flexWrap="wrap">
                                    <SignalIndicator
                                        signalName="discord"
                                        icon={faDiscord}
                                        text="Discord"
                                        project={currentProject}
                                        button
                                    />
                                    <SignalIndicator
                                        signalName="discourse_forum"
                                        icon={faDiscourse}
                                        text="Forum"
                                        project={currentProject}
                                        button
                                    />
                                </HStack>
                            </HStack>
                        </VStack>
                    </VStack>
                ) : (
                    <HStack w="200px" h="50px" justifyContent="center">
                        {error ? (
                            <Text fontSize="sm">Error: {error}</Text>
                        ) : (
                            <Skeleton defaultSkeleton height="100%" width="200px" borderRadius="full" mt={"20px"} />
                        )}
                    </HStack>
                )}
                {!loading && !error && <Text>{currentProject?.displayName} Leaderboard</Text>}
            </VStack>
            {!loading && !error && currentProject && <Leaderboard project={currentProject} />}
        </VStack>
    )
}
