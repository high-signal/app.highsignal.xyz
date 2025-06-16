"use client"

import { VStack, Text, HStack } from "@chakra-ui/react"

import ContentContainer from "../layout/ContentContainer"
import { useGetUsers } from "../../hooks/useGetUsers"
import { useParams } from "next/navigation"
import Leaderboard from "../leaderboard/Leaderboard"
import { useGetProjects } from "../../hooks/useGetProjects"

export default function UserProfileContainer() {
    const { username } = useParams()

    const { projects, loading: projectsLoading, error: projectsError } = useGetProjects()

    const {
        users: currentUserData,
        loading: usersLoading,
        error: usersError,
        refreshUserData,
    } = useGetUsers(undefined, username as string)

    return (
        <ContentContainer>
            <VStack gap={6} w="100%" maxW="500px" mx="auto" p={4}>
                <Text fontSize="2xl" fontWeight="bold">
                    User Profile
                </Text>
                <VStack>
                    {projects
                        .map((project) => {
                            const userProject = currentUserData.find((user) => user.projectSlug === project.urlSlug)
                            return {
                                project,
                                userProject,
                                score: userProject?.score || 0,
                            }
                        })
                        .sort((a, b) => {
                            // First sort by score (descending)
                            if (b.score !== a.score) {
                                return b.score - a.score
                            }
                            // If scores are equal, sort alphabetically by urlSlug
                            return a.project.urlSlug.localeCompare(b.project.urlSlug)
                        })
                        .map(({ project, userProject }) => (
                            <HStack
                                key={project.urlSlug}
                                w="100%"
                                justify="space-between"
                                p={2}
                                borderWidth={1}
                                borderRadius="md"
                            >
                                <Text>{project.urlSlug}</Text>
                                <Text>{userProject?.score || 0}</Text>
                                <Text>{userProject?.signal || "none"}</Text>
                            </HStack>
                        ))}
                </VStack>
            </VStack>
        </ContentContainer>
    )
}
