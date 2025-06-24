"use client"

import { VStack, Text, Spinner, Box } from "@chakra-ui/react"
import { useEffect, useState } from "react"

import Title from "./Title"
import UserInfo from "./UserInfo"
import CurrentSignal from "./CurrentSignal"
import PeakSignalsContainer from "./peak-signals/PeakSignalsContainer"
import SignalStrengthContainer from "./signal-strength/SignalStrengthContainer"

import { useGetUsers } from "../../hooks/useGetUsers"
import { useGetProjects } from "../../hooks/useGetProjects"
import AcmeIncPlaceholder from "../ui/AcmeIncPlaceholder"
import { useUser } from "../../contexts/UserContext"

export default function SignalDisplayContainer({ project, username }: { project: string; username: string }) {
    const { loggedInUser, loggedInUserLoading } = useUser()
    const [isUserDataVisible, setIsUserDataVisible] = useState(false)
    const [shouldFetch, setShouldFetch] = useState(false)

    // Check if the logged in user has access to the target user data
    useEffect(() => {
        if (!loggedInUserLoading) {
            if (
                loggedInUser?.username === username ||
                loggedInUser?.projectAdmins?.some((adminProject) => adminProject?.urlSlug === project) ||
                loggedInUser?.isSuperAdmin
            ) {
                setIsUserDataVisible(true)
                setShouldFetch(true)
            } else {
                setIsUserDataVisible(false)
                setShouldFetch(true)
            }
        }
    }, [loggedInUserLoading, loggedInUser, project, username])

    const {
        users,
        loading: usersLoading,
        error: usersError,
        refreshUserData,
    } = useGetUsers({
        project: project,
        username: username,
        shouldFetch: shouldFetch,
        isUserDataVisible: isUserDataVisible,
    })
    const { projects, loading: projectsLoading, error: projectsError } = useGetProjects(project)

    const currentUser = users[0]
    const currentProject = projects[0]

    if (loggedInUserLoading || usersLoading || projectsLoading) {
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

    if (!currentUser || !currentProject) {
        return (
            <VStack gap={10} w="100%" maxW="800px" borderRadius="20px">
                <Text>Error: No user or project found</Text>
            </VStack>
        )
    }

    // Display placeholder for example project
    if (currentProject?.urlSlug === "acme-inc") {
        return <AcmeIncPlaceholder projectData={currentProject} />
    }

    return (
        <VStack gap={12} w="100%" maxW="800px" pb={6} pt={{ base: 4, sm: 0 }}>
            <VStack gap={0} w="100%" maxW="800px" px={3}>
                <Title projectData={currentProject} />
                <Box w="100%" h="10px" />
                <UserInfo
                    profileImageUrl={currentUser.profileImageUrl || ""}
                    displayName={currentUser.displayName || ""}
                    username={currentUser.username || ""}
                />
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
                projectSignalStrengths={currentProject?.signalStrengths}
                projectData={currentProject}
                refreshUserData={refreshUserData}
            />
        </VStack>
    )
}
