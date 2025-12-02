"use client"

import { VStack, Text, HStack, Image, Skeleton, Spinner, Button, Box, useBreakpointValue } from "@chakra-ui/react"
import Link from "next/link"

import ContentContainer from "../layout/ContentContainer"
import Leaderboard from "../leaderboard/Leaderboard"
import { useGetUsers } from "../../hooks/useGetUsers"
import { useParams } from "next/navigation"
import { ASSETS } from "../../config/constants"
import { useUser } from "../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPencil } from "@fortawesome/free-solid-svg-icons"
import ShellUserImage from "../ui/ShellUserImage"
import { useEffect, useState } from "react"

export default function UserProfileContainer() {
    const { login, authenticated } = usePrivy()
    const { username } = useParams()
    const { loggedInUser, loggedInUserLoading } = useUser()
    const { users, loading, error } = useGetUsers({
        username: username as string,
    })

    const [singleUserData, setSingleUserData] = useState<UserData | undefined>(undefined)

    const showFullText = useBreakpointValue({ base: false, sm: true })

    // If users finishes loading and no data was found, fetch the user data from the user API
    useEffect(() => {
        const fetchUserData = async () => {
            const response = await fetch(`/api/single-user/${username}`)
            const data = await response.json()
            setSingleUserData(data)
        }
        if (!loading && users?.length === 0) {
            fetchUserData()
        }
    }, [users, username, loading])

    return (
        <ContentContainer>
            <VStack gap={5} w="100%" maxW="500px" borderRadius="20px">
                <VStack
                    fontSize="3xl"
                    px={3}
                    pt={6}
                    w="100%"
                    textAlign="center"
                    gap={5}
                    flexWrap="wrap"
                    justifyContent="center"
                >
                    {!loading && !error ? (
                        <HStack gap={{ base: 3, sm: 5 }} w={"100%"} justifyContent={"center"}>
                            {username?.toString().startsWith("~") ? (
                                <ShellUserImage
                                    type={(users && users[0]?.profileImageUrl) || singleUserData?.profileImageUrl || ""}
                                    boxSize={{ base: "100px", sm: "130px" }}
                                    iconSize="50px"
                                />
                            ) : (
                                <Image
                                    src={
                                        (users && users[0]?.profileImageUrl) ||
                                        singleUserData?.profileImageUrl ||
                                        ASSETS.DEFAULT_PROFILE_IMAGE
                                    }
                                    alt={(users && users[0]?.displayName) || singleUserData?.displayName || ""}
                                    boxSize="130px"
                                    borderRadius="full"
                                />
                            )}
                            <VStack gap={1} alignItems="center">
                                <Text
                                    fontWeight="bold"
                                    wordBreak="break-word" // breaks only at normal word boundaries
                                    overflowWrap="anywhere" // allows breaking inside words when still too long
                                    lineHeight="1.2"
                                >
                                    {(users && users[0]?.displayName) || singleUserData?.displayName}
                                </Text>
                                <Text
                                    fontSize="md"
                                    color="textColorMuted"
                                    mt={"-5px"}
                                    wordBreak="break-word" // breaks only at normal word boundaries
                                    overflowWrap="anywhere" // allows breaking inside words when still too long
                                    lineHeight="1.2"
                                >
                                    {(users && users[0]?.username) || singleUserData?.username}{" "}
                                </Text>
                                {!loggedInUserLoading && loggedInUser?.username === username && (
                                    <Box mt={"-5px"}>
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
                                {!loggedInUserLoading &&
                                    ((users && users[0]?.username?.startsWith("~")) ||
                                        singleUserData?.username?.startsWith("~")) && (
                                        <VStack
                                            gap={0}
                                            bg={"contentBackground"}
                                            px={3}
                                            pb={"2px"}
                                            borderRadius="12px"
                                            mt={1}
                                        >
                                            <Text
                                                fontSize="sm"
                                                color="textColorMuted"
                                                mb={process.env.NEXT_PUBLIC_SITE_TYPE !== "snapshot" ? "-5px" : "0px"}
                                                mt={1}
                                                textWrap={"wrap"}
                                            >
                                                This user was auto-generated
                                            </Text>
                                            {process.env.NEXT_PUBLIC_SITE_TYPE !== "snapshot" && (
                                                <>
                                                    {authenticated && loggedInUser ? (
                                                        <Link
                                                            href={`/settings/u/${loggedInUser?.username}?tab=accounts`}
                                                        >
                                                            <Button primaryButton px={3} py={"2px"} borderRadius="full">
                                                                <HStack gap={0}>
                                                                    <Text>Claim this account</Text>
                                                                </HStack>
                                                            </Button>
                                                        </Link>
                                                    ) : (
                                                        <HStack minH={"45px"}>
                                                            <Button
                                                                primaryButton
                                                                px={2}
                                                                py={"2px"}
                                                                borderRadius="full"
                                                                onClick={() => {
                                                                    login()
                                                                }}
                                                            >
                                                                <HStack gap={1}>
                                                                    <Text>Login to claim</Text>
                                                                    {showFullText ? (
                                                                        <Text>this account</Text>
                                                                    ) : (
                                                                        <Text>account</Text>
                                                                    )}
                                                                </HStack>
                                                            </Button>
                                                        </HStack>
                                                    )}
                                                </>
                                            )}
                                        </VStack>
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
                </VStack>
                {loading ? (
                    <Spinner />
                ) : (
                    users && <Leaderboard mode="projects" data={users} singleUserData={singleUserData} />
                )}
            </VStack>
        </ContentContainer>
    )
}
