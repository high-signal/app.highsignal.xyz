"use client"

import { VStack, Text, Spinner } from "@chakra-ui/react"
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
        <VStack gap={6} w="100%" maxW="800px" py={6} zIndex={10}>
            <VStack gap={3} w="100%" maxW="600px" px={3}>
                <Title projectData={currentProject} />
                <UserInfo profileImageUrl={currentUser.profileImageUrl} name={currentUser.displayName} />
                <CurrentSignal signal={currentUser.signal} signalValue={currentUser.score} />
            </VStack>
            <PeakSignalsContainer peakSignals={currentUser.peakSignals} />
            <SignalStrengthContainer
                userSignalStrengths={currentUser.signalStrengths}
                projectSignalStrengths={enabledSignalStrengths}
            />
        </VStack>
    )
}
