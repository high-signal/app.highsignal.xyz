"use client"

import { VStack, Text, HStack, Image, Skeleton, Spinner, Button, Box } from "@chakra-ui/react"
import Link from "next/link"

import ContentContainer from "../layout/ContentContainer"
import Leaderboard from "../leaderboard/Leaderboard"
import { useGetUsers } from "../../hooks/useGetUsers"
import { useParams } from "next/navigation"
import { ASSETS } from "../../config/constants"
import { useUser } from "../../contexts/UserContext"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPencil } from "@fortawesome/free-solid-svg-icons"

export default function UserProfileContainer() {
    const { username } = useParams()
    const { loggedInUser, loggedInUserLoading } = useUser()
    const { users, loading, error } = useGetUsers({
        username: username as string,
    })

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
                        <HStack gap={3}>
                            <Image
                                src={users[0]?.profileImageUrl || ASSETS.DEFAULT_PROFILE_IMAGE}
                                alt={users[0]?.displayName}
                                boxSize="80px"
                                borderRadius="full"
                            />
                            <VStack gap={0}>
                                <Text fontWeight="bold">{users[0]?.displayName}</Text>
                                {!loggedInUserLoading && loggedInUser?.username === username && (
                                    <Box mt={"-10px"}>
                                        <Link href={`/settings/u/${loggedInUser?.username}`}>
                                            <Button secondaryButton px={2} py={1} borderRadius="full">
                                                <HStack>
                                                    <FontAwesomeIcon icon={faPencil} />
                                                    <Text>Edit profile</Text>
                                                </HStack>
                                            </Button>
                                        </Link>
                                    </Box>
                                )}
                            </VStack>
                        </HStack>
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
