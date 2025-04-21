"use client"

import { VStack, Text } from "@chakra-ui/react"
import { useUser } from "../../contexts/UserContext"

import ContentContainer from "../layout/ContentContainer"

export default function UserProfileContainer() {
    const { user } = useUser()

    return (
        <ContentContainer>
            <VStack gap={6} w="100%" maxW="500px" mx="auto" p={4}>
                <Text fontSize="2xl" fontWeight="bold">
                    User Profile
                </Text>
                <Text>Coming soon...</Text>
            </VStack>
        </ContentContainer>
    )
}
