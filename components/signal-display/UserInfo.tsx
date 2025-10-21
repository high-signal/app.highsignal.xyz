"use client"

import { VStack, HStack, Text, Box, Image, Button, useBreakpointValue } from "@chakra-ui/react"
import Link from "next/link"
import { ASSETS } from "../../config/constants"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faMedal } from "@fortawesome/free-solid-svg-icons"

import { useUser } from "../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"

import ShellUserImage from "../ui/ShellUserImage"

export default function UserInfo({ currentUser }: { currentUser: UserData }) {
    const { loggedInUser } = useUser()
    const { login, authenticated } = usePrivy()

    const showFullText = useBreakpointValue({ base: false, sm: true })

    return (
        <HStack
            gap={3}
            borderLeftRadius={{ base: "0px", sm: "100px" }}
            borderRightRadius={{ base: "0px", sm: "40px" }}
            pr={4}
            pl={{ base: 3, sm: 0 }}
            py={{ base: 2, sm: 0 }}
            w={{ base: "100%", sm: "auto" }}
            bg={"contentBackground"}
            justifyContent={"center"}
        >
            {currentUser.username?.startsWith("~") ? (
                <ShellUserImage
                    type={currentUser.profileImageUrl || ""}
                    boxSize={{ base: "130px", sm: "190px" }}
                    iconSize={"60px"}
                />
            ) : (
                <Image
                    src={currentUser.profileImageUrl || ASSETS.DEFAULT_PROFILE_IMAGE}
                    alt={currentUser.displayName || ""}
                    boxSize={{ base: "130px", sm: "160px" }}
                    borderRadius="full"
                />
            )}
            <VStack
                gap={2}
                alignItems="center"
                justifyContent={"center"}
                minH={"130px"}
                px={2}
                py={2}
                cursor={"default"}
            >
                <VStack gap={1} alignItems="center">
                    <Text
                        fontWeight="bold"
                        fontSize="30px"
                        mt="0px"
                        wordBreak="break-word" // breaks only at normal word boundaries
                        overflowWrap="anywhere" // allows breaking inside words when still too long
                        lineHeight="1.2"
                    >
                        {currentUser.displayName || ""}
                    </Text>
                    <Text fontSize="md" color="textColorMuted" mt={"-5px"} pl={"2px"}>
                        {currentUser.username || ""}
                    </Text>
                </VStack>
                <HStack justifyContent={"center"} pl={1}>
                    <Box color={"gold.500"}>
                        <FontAwesomeIcon icon={faMedal} size={"lg"} />
                    </Box>
                    <Text>Rank:</Text>
                    <Text
                        fontWeight={"bold"}
                        bg={"pageBackground"}
                        minW={"40px"}
                        px={2}
                        py={1}
                        borderRadius={"full"}
                        textAlign={"center"}
                    >
                        {currentUser.rank || "-"}
                    </Text>
                </HStack>
                <HStack
                    flexWrap={"wrap"}
                    gap={3}
                    justifyContent={"center"}
                    alignItems={"end"}
                    pt={currentUser.username?.startsWith("~") ? 0 : 1}
                >
                    {currentUser.username?.startsWith("~") && (
                        <VStack gap={2} bg={"pageBackground"} px={3} pb={2} borderRadius="12px" mt={1}>
                            <Text
                                fontSize="sm"
                                color="textColorMuted"
                                mb={"-5px"}
                                mt={1}
                                textWrap={"wrap"}
                                textAlign={"center"}
                            >
                                This user was auto-generated
                            </Text>
                            {authenticated && loggedInUser ? (
                                <Link href={`/settings/u/${loggedInUser?.username}?tab=accounts`}>
                                    <Button primaryButton px={3} py={"2px"} borderRadius="full">
                                        <HStack gap={0}>
                                            <Text>Claim this account</Text>
                                        </HStack>
                                    </Button>
                                </Link>
                            ) : (
                                <Button
                                    primaryButton
                                    px={3}
                                    py={"2px"}
                                    borderRadius="full"
                                    onClick={() => {
                                        login()
                                    }}
                                >
                                    <HStack gap={1} flexWrap={"wrap"} justifyContent={"center"}>
                                        <Text>Login to claim</Text>
                                        {showFullText ? <Text>this account</Text> : <Text>account</Text>}
                                    </HStack>
                                </Button>
                            )}
                        </VStack>
                    )}

                    <Box pb={currentUser.username?.startsWith("~") ? 1 : "0px"}>
                        <Link href={`/u/${currentUser.username}`}>
                            <Button secondaryButton px={3} py={1} borderRadius="full">
                                <HStack gap={0}>
                                    <Text>View profile</Text>
                                </HStack>
                            </Button>
                        </Link>
                    </Box>
                </HStack>
            </VStack>
        </HStack>
    )
}
