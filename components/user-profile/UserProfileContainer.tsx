"use client"

import { VStack, Text, HStack, Image, Skeleton, Spinner } from "@chakra-ui/react"

import ContentContainer from "../layout/ContentContainer"
import { useGetUsers } from "../../hooks/useGetUsers"
import { useParams } from "next/navigation"
import Leaderboard from "../leaderboard/Leaderboard"
import { ASSETS } from "../../config/constants"

export default function UserProfileContainer() {
    const { username } = useParams()
    const { users, loading, error } = useGetUsers(undefined, username as string)

    return (
        <ContentContainer>
            <VStack gap={5} w="100%" maxW="500px" borderRadius="20px">
                <VStack
                    fontSize="3xl"
                    px={6}
                    pt={6}
                    w="100%"
                    textAlign="center"
                    gap={5}
                    flexWrap="wrap"
                    justifyContent="center"
                >
                    {!loading && !error ? (
                        <>
                            <HStack gap={3}>
                                <Image
                                    src={users[0]?.profileImageUrl || ASSETS.DEFAULT_PROFILE_IMAGE}
                                    alt={users[0]?.displayName}
                                    boxSize="80px"
                                    borderRadius="full"
                                />
                                <Text fontWeight="bold">{users[0]?.displayName} </Text>
                            </HStack>
                        </>
                    ) : (
                        <HStack w="200px" h="80px" justifyContent="center">
                            {error ? (
                                <Text fontSize="sm">Error: {error}</Text>
                            ) : (
                                <Skeleton defaultSkeleton height="100%" width="200px" borderRadius="full" />
                            )}
                        </HStack>
                    )}
                    <Text>High Signal Profile</Text>
                </VStack>
                {loading ? <Spinner /> : users && <Leaderboard mode="projects" data={users} />}
            </VStack>
        </ContentContainer>
    )
}
