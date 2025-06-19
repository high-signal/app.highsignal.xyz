import { HStack, Text, Box, Image, Button } from "@chakra-ui/react"
import Link from "next/link"
import { ASSETS } from "../../config/constants"

interface UserInfoProps {
    profileImageUrl: string
    displayName: string
    username: string
}

export default function UserInfo({ profileImageUrl, displayName, username }: UserInfoProps) {
    return (
        <HStack justifyContent={"center"} w={"100%"} maxW="600px" pb={2}>
            <Link href={`/u/${username}`}>
                <Button
                    secondaryButton
                    py={0}
                    pr={6}
                    w={"fit-content"}
                    justifyContent={"start"}
                    borderRadius="full"
                    gap={4}
                    minW="250px"
                >
                    <Box boxSize="100px" minW="100px" borderRadius="full" overflow="hidden" flexGrow={0}>
                        <Image
                            src={
                                !profileImageUrl || profileImageUrl === ""
                                    ? ASSETS.DEFAULT_PROFILE_IMAGE
                                    : profileImageUrl
                            }
                            alt={`User ${displayName} Profile Image`}
                            fit="cover"
                        />
                    </Box>
                    <HStack justifyContent={"center"} flexGrow={1}>
                        <Text
                            textAlign={"center"}
                            fontSize={
                                displayName.length >= 15 ? { base: "2xl", sm: "3xl" } : { base: "3xl", sm: "3xl" }
                            }
                        >
                            {displayName}
                        </Text>
                    </HStack>
                </Button>
            </Link>
        </HStack>
    )
}
;``
