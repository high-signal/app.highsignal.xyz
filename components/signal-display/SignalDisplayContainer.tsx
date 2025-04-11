"use client"

import { VStack, Text, Spinner, Box, HStack } from "@chakra-ui/react"
import Title from "./Title"
import UserInfo from "./UserInfo"
import CurrentSignal from "./CurrentSignal"
import PeakSignalsContainer from "./peak-signals/PeakSignalsContainer"
import SignalStrengthContainer from "./signal-strength/SignalStrengthContainer"

import { useGetUsers } from "../../hooks/useGetUsers"
import { useGetProjects } from "../../hooks/useGetProjects"

export default function SignalDisplayContainer({ project, username }: { project: string; username: string }) {
    const { users, loading: usersLoading, error: usersError } = useGetUsers(project, username)
    const { projects, loading: projectsLoading, error: projectsError } = useGetProjects(project)

    const currentUser = users[0]
    const currentProject = projects[0]

    if (usersLoading || projectsLoading) {
        return (
            <VStack gap={10} w="100%" minH="300px" justifyContent="center" alignItems="center" borderRadius="20px">
                <Spinner size="lg" />
            </VStack>
        )
    }

    if (usersError || projectsError) {
        return (
            <VStack gap={10} w="100%" maxW="800px" borderRadius="20px">
                <Text color="red.500">Error: {usersError || projectsError}</Text>
            </VStack>
        )
    }

    // Filter out signal strengths that are not enabled
    const enabledSignalStrengths = currentProject.signalStrengths.filter((signalStrength) => signalStrength.enabled)

    return (
        <VStack gap={12} w="100%" maxW="700px" py={6} zIndex={10}>
            <VStack gap={0} w="100%" maxW="600px" px={3}>
                <Title projectData={currentProject} />
                <Box w="100%" h="10px" />
                <UserInfo profileImageUrl={currentUser.profileImageUrl} name={currentUser.displayName} />
                <Box w="100%" h={{ base: "30px", sm: "20px" }} />
                <CurrentSignal signal={currentUser.signal} signalValue={currentUser.score} />
                <HStack w="100%" justifyContent="space-between">
                    <Text color="white">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce non quam non ligula imperdiet
                        laoreet. Donec ac quam ac felis laoreet dignissim eu quis lacus. Aenean dignissim blandit diam
                        non blandit. Nunc semper elementum quam, ac porttitor sem ultrices blandit. Etiam vel varius
                        orci, placerat feugiat magna. Ut mollis ligula sit amet elit placerat cursus. Aliquam varius
                        ante et odio porttitor, ac sodales metus placerat.
                    </Text>
                </HStack>
            </VStack>
            <PeakSignalsContainer
                currentUser={currentUser}
                peakSignals={currentUser.peakSignals}
                projectData={currentProject}
            />
            <SignalStrengthContainer
                userSignalStrengths={currentUser.signalStrengths}
                projectSignalStrengths={enabledSignalStrengths}
                projectData={currentProject}
            />
        </VStack>
    )
}
