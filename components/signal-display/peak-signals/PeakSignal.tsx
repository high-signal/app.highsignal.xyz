import { Box, VStack, Text, Image } from "@chakra-ui/react"

interface SignalBoxProps {
    imageSrc: string
    imageAlt: string
    name: string
    value: number
}

export default function PeakSignal({ imageSrc, imageAlt, name, value }: SignalBoxProps) {
    return (
        <Box
            border={"3px solid"}
            borderColor="gray.800"
            borderTopRadius="20px"
            borderBottomRadius="100px"
            textAlign="center"
            overflow="hidden"
        >
            <VStack>
                <Box position="relative" w="100%" h="165px">
                    <Image src={imageSrc} alt={imageAlt} objectFit="cover" w="100%" h="100%" />
                </Box>
                <Text fontWeight={"bold"}>{name}</Text>
                <Text bg={"green.500"} fontSize="xl" px={2} borderRadius="8px" mb={3} color="#029E03">
                    {value}
                </Text>
            </VStack>
        </Box>
    )
}
