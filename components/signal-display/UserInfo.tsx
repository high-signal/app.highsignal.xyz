"use client"

import { VStack, HStack, Text, Box, Image, Button } from "@chakra-ui/react"
import Link from "next/link"
import { ASSETS } from "../../config/constants"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faMedal, faUser } from "@fortawesome/free-solid-svg-icons"

import ShellUserImage from "../ui/ShellUserImage"

export default function UserInfo({ currentUser }: { currentUser: UserData }) {
    return (
        <HStack
            gap={3}
            borderLeftRadius={{ base: "0px", sm: "100px" }}
            borderRightRadius={{ base: "0px", sm: "50px" }}
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
                    boxSize={{ base: "130px", sm: "160px" }}
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
                alignItems="start"
                justifyContent={"center"}
                minH={"130px"}
                px={2}
                py={2}
                cursor={"default"}
            >
                <VStack gap={1} alignItems="start">
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
                <Box pt={1}>
                    <Link href={`/u/${currentUser.username}`}>
                        <Button secondaryButton px={2} py={1} borderRadius="full">
                            <HStack gap={0}>
                                <FontAwesomeIcon icon={faUser} />
                                <Text>View profile</Text>
                            </HStack>
                        </Button>
                    </Link>
                </Box>
            </VStack>
        </HStack>
    )
}
