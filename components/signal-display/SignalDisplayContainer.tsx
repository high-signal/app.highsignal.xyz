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
    const [isLoading, setIsLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<UserData | null>(null)
    const [currentProject, setCurrentProject] = useState<ProjectData | null>(null)
    const [noUsersFound, setNoUsersFound] = useState(false)
    const [noProjectsFound, setNoProjectsFound] = useState(false)

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

    // Get the users and projects
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

    // Set the current user and project
    useEffect(() => {
        if (shouldFetch && !usersLoading && !projectsLoading && !loggedInUserLoading) {
            if (users && users.length > 0) {
                setCurrentUser(users[0])
            } else if (users && users.length === 0) {
                setNoUsersFound(true)
            }
            if (projects && projects.length > 0) {
                setCurrentProject(projects[0])
            } else if (projects && projects.length === 0) {
                setNoProjectsFound(true)
            }
        }
    }, [users, projects, usersLoading, projectsLoading, shouldFetch, loggedInUserLoading])

    // If the current user and project are set, set isLoading to false
    useEffect(() => {
        if (currentUser && currentProject) {
            setIsLoading(false)
        }
    }, [currentUser, currentProject])

    // If there is an error, set isLoading to false
    useEffect(() => {
        if (usersError || projectsError || noUsersFound || noProjectsFound) {
            setIsLoading(false)
        }
    }, [usersError, projectsError, noUsersFound, noProjectsFound])

    // If there is no user or project found, show an error
    if (noUsersFound || noProjectsFound) {
        console.log("SHOWING ERROR: No user or project found")
        return (
            <VStack gap={10} w="100%" maxW="800px" borderRadius="20px">
                {!noProjectsFound && noUsersFound && (
                    <Text>
                        No user found with the username{" "}
                        <Text as="span" fontWeight="bold">
                            {username}
                        </Text>
                    </Text>
                )}
                {noProjectsFound && (
                    <Text>
                        No projects found for{" "}
                        <Text as="span" fontWeight="bold">
                            {project}
                        </Text>
                    </Text>
                )}
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

    if (isLoading) {
        return (
            <VStack gap={10} w="100%" minH="300px" justifyContent="center" alignItems="center" borderRadius="20px">
                <Spinner size="lg" />
            </VStack>
        )
    }

    // Display placeholder for example project
    if (currentProject?.urlSlug === "acme-inc") {
        return <AcmeIncPlaceholder projectData={currentProject} />
    }

    if (currentUser && currentProject) {
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
}
