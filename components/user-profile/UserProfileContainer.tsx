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
                <Leaderboard mode="projects" data={currentUserData} />
            </VStack>
        </ContentContainer>
    )
}
