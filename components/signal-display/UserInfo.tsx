import { HStack, Text, Box, Image } from "@chakra-ui/react"
import { ASSETS } from "../../config/constants"

interface UserInfoProps {
    profileImageUrl: string
    name: string
}

export default function UserInfo({ profileImageUrl, name }: UserInfoProps) {
    return (
        <HStack justifyContent={"center"} w={"100%"} maxW="600px" pb={2}>
            <HStack
                bg={"pageBackground"}
                border={"4px solid"}
                borderColor={"contentBorder"}
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
                            !profileImageUrl || profileImageUrl === "" ? ASSETS.DEFAULT_PROFILE_IMAGE : profileImageUrl
                        }
                        alt={`User ${name} Profile Image`}
                        fit="cover"
                    />
                </Box>
                <HStack justifyContent={"center"} flexGrow={1}>
                    <Text
                        textAlign={"center"}
                        fontSize={name.length >= 15 ? { base: "2xl", sm: "3xl" } : { base: "3xl", sm: "3xl" }}
                    >
                        {name}
                    </Text>
                </HStack>
            </HStack>
        </HStack>
    )
}
;``
