"use client"

import { VStack, Text, Spinner, Box } from "@chakra-ui/react"
import { useEffect, useState } from "react"

import Title from "./Title"
import UserInfo from "./UserInfo"
import CurrentSignal from "./CurrentSignal"
import PeakSignalsContainer from "./peak-signals/PeakSignalsContainer"
import SignalStrengthContainer from "./signal-strength/SignalStrengthContainer"
import SignalScoreDescription from "./SignalScoreDescription"

import { useGetUsers } from "../../hooks/useGetUsers"
import { useGetProjects } from "../../hooks/useGetProjects"
import AcmeIncPlaceholder from "../ui/AcmeIncPlaceholder"
import { useUser } from "../../contexts/UserContext"
import { useParams } from "next/navigation"

import SharedAccountsContainer from "./SharedAccountsContainer"

export default function SignalDisplayContainer({ project, username }: { project: string; username: string }) {
    const { loggedInUser, loggedInUserLoading } = useUser()
    const [isUserDataVisible, setIsUserDataVisible] = useState(false)
    const [shouldFetch, setShouldFetch] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<UserData | null>(null)
    const [currentProject, setCurrentProject] = useState<ProjectData | null>(null)
    const [noUsersFound, setNoUsersFound] = useState(false)
    const [noProjectsFound, setNoProjectsFound] = useState(false)

    const params = useParams()
    const targetUsername = params.username as string
    const isOwner = loggedInUser?.username === targetUsername

    const [isSignalStrengthLoading, setIsSignalStrengthLoading] = useState<number | null>(null)

    // If lastChecked for any of the signals is less than X seconds ago, set isSignalStrengthLoading to true
    useEffect(() => {
        const isSignalStrengthLoading = (currentUser?.signalStrengths || [])
            .map((signalStrength) => signalStrength.data[0].lastChecked)
            .filter((lastChecked) => lastChecked !== undefined)
            .map(Number)
            .reduce((min, current) => (current < min ? current : min), Infinity)

        setIsSignalStrengthLoading(isSignalStrengthLoading === Infinity ? null : isSignalStrengthLoading)
    }, [currentUser])

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
            <VStack gap={6} w="100%" maxW="1400px" pb={6}>
                <VStack gap={0} w="100%" maxW="1400px">
                    <Title projectData={currentProject} linkUrl={currentProject?.website} />
                    {isOwner && <Box w="100%" h={{ base: "10px", sm: "0" }} />}
                    {isOwner && <SharedAccountsContainer projectData={currentProject} />}
                    <Box w="100%" h="20px" />
                    <UserInfo currentUser={currentUser} />
                    <Box w="100%" h={{ base: "30px", sm: "30px" }} />
                    <CurrentSignal currentUser={currentUser} isSignalStrengthLoading={!!isSignalStrengthLoading} />
                    <SignalScoreDescription
                        currentUser={currentUser}
                        projectData={currentProject}
                        isSignalStrengthLoading={isSignalStrengthLoading}
                    />
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
