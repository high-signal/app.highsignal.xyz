"use client"

import { VStack, HStack, Text, Box, Image, Button } from "@chakra-ui/react"
import Link from "next/link"
import { ASSETS } from "../../config/constants"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faUser } from "@fortawesome/free-solid-svg-icons"

interface UserInfoProps {
    profileImageUrl: string
    displayName: string
    username: string
}

export default function UserInfo({ profileImageUrl, displayName, username }: UserInfoProps) {
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
            <Image
                src={profileImageUrl || ASSETS.DEFAULT_PROFILE_IMAGE}
                alt={displayName || ""}
                boxSize="130px"
                borderRadius="full"
            />
            <VStack gap={2} alignItems="space-between" justifyContent={"center"} minH={"130px"} px={2} py={2}>
                <VStack gap={1} alignItems="start">
                    <Text fontWeight="bold" fontSize={"30px"} mt={"0px"} wordBreak="break-all" lineHeight="1.2">
                        {displayName}
                    </Text>
                    <Text fontSize="md" color="textColorMuted" mt={"-5px"} pl={"2px"}>
                        {username}
                    </Text>
                </VStack>
                <Box pt={1}>
                    <Link href={`/u/${username}`}>
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
