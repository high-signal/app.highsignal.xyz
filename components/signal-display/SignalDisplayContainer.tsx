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
    const { users, loading: usersLoading, error: usersError, refreshUserData } = useGetUsers(project, username)
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
    const enabledSignalStrengths = currentProject?.signalStrengths.filter((signalStrength) => signalStrength.enabled)

    if (enabledSignalStrengths?.length === 0) {
        return (
            <VStack gap={10} w="100%" maxW="800px" borderRadius="20px">
                <Text>No signal strengths are currently enabled for this project</Text>
            </VStack>
        )
    }

    if (!currentUser || !currentProject) {
        return (
            <VStack gap={10} w="100%" maxW="800px" borderRadius="20px">
                <Text>Error: No user or project found</Text>
            </VStack>
        )
    }

    return (
        <VStack gap={12} w="100%" maxW="700px" py={6}>
            <VStack gap={0} w="100%" maxW="600px" px={3}>
                <Title projectData={currentProject} />
                <Box w="100%" h="10px" />
                <UserInfo profileImageUrl={currentUser.profileImageUrl || ""} name={currentUser.displayName || ""} />
                <Box w="100%" h={{ base: "30px", sm: "20px" }} />
                <CurrentSignal currentUser={currentUser} />
                {/* <HStack w="100%" justifyContent="space-between">
                    <Text textAlign="center">
                        Placeholder text for the user summary. Placeholder text for the user summary. Placeholder text
                        for the user summary. Placeholder text for the user summary. Placeholder text for the user
                        summary. Placeholder text for the user summary.
                    </Text>
                </HStack> */}
            </VStack>
            {currentProject.peakSignalsEnabled && (
                <PeakSignalsContainer
                    currentUser={currentUser}
                    peakSignals={currentUser.peakSignals || []}
                    projectData={currentProject}
                />
            )}
            <SignalStrengthContainer
                currentUser={currentUser}
                projectSignalStrengths={enabledSignalStrengths}
                projectData={currentProject}
                refreshUserData={refreshUserData}
            />
        </VStack>
    )
}
