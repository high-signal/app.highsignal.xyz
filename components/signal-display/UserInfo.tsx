import { HStack, Text, Box, Image } from "@chakra-ui/react"

interface UserInfoProps {
    operatorImage: string
    operatorNumber: string
    name: string
}

export default function UserInfo({ operatorImage, operatorNumber, name }: UserInfoProps) {
    return (
        <HStack justifyContent={"center"} w={"100%"} pb={2}>
            <HStack
                border={"4px solid"}
                borderColor={"gray.800"}
                py={0}
                pr={6}
                w={"fit-content"}
                justifyContent={"start"}
                borderRadius="full"
                gap={4}
                position="relative"
            >
                <Box position="relative" boxSize="100px" borderRadius="full" overflow="hidden">
                    <Image src={operatorImage} alt={`Operator ${operatorNumber}`} fit="cover" />
                </Box>
                <Text fontSize={name.length > 15 ? { base: "2xl", md: "3xl" } : { base: "3xl", md: "3xl" }}>
                    {name}
                </Text>
            </HStack>
        </HStack>
    )
}
