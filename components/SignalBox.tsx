import { Box, VStack, Text } from "@chakra-ui/react"
import Image from "next/image"

interface SignalBoxProps {
    imageSrc: string
    imageAlt: string
    title: string
    value: string
}

export default function SignalBox({ imageSrc, imageAlt, title, value }: SignalBoxProps) {
    return (
        <Box
            border={"3px solid"}
            borderColor="blue.600"
            borderTopRadius="20px"
            borderBottomRadius="100px"
            textAlign="center"
            overflow="hidden"
        >
            <VStack>
                <Box position="relative" w="100%" h="0" pb="100%">
                    <Image src={imageSrc} alt={imageAlt} layout="fill" objectFit="cover" />
                </Box>
                <Text fontWeight={"bold"}>{title}</Text>
                <Text bg={"green.500"} fontSize="xl" px={2} borderRadius="8px" mb={3}>
                    {value}
                </Text>
            </VStack>
        </Box>
    )
}
