"use client"

import { VStack, Text } from "@chakra-ui/react"

import ContentContainer from "../layout/ContentContainer"
import { useGetUsers } from "../../hooks/useGetUsers"
import { useParams } from "next/navigation"

export default function UserProfileContainer() {
    const { username } = useParams()

    const {
        users,
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
                <Text>{JSON.stringify(users)}</Text>
            </VStack>
        </ContentContainer>
    )
}
