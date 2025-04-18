"use client"

import { VStack, Text } from "@chakra-ui/react"
import { useUser } from "../../contexts/UserContext"

import ContentContainer from "../layout/ContentContainer"

export default function UserProfileContainer() {
    const { user } = useUser()

    return (
        <ContentContainer>
            <VStack>
                <Text>User Settings</Text>
            </VStack>
        </ContentContainer>
    )
}
