import { Box, Text, Image, HStack, VStack } from "@chakra-ui/react"

export default function PeakSignal({ peakSignal }: { peakSignal: PeakSignalUserData }) {
    return (
        <HStack
            bg={"pageBackground"}
            border={"3px solid"}
            borderColor="gray.800"
            borderRadius="full"
            textAlign="center"
            overflow="hidden"
            w="100%"
            maxW={{ base: "100%", md: "350px" }}
            gap={3}
        >
            <Box
                position="relative"
                minW={"90px"}
                maxW={"90px"}
                minH={"90px"}
                maxH={"90px"}
                borderRadius="full"
                overflow="hidden"
            >
                <Image
                    src={peakSignal.imageSrc}
                    alt={peakSignal.imageAlt}
                    objectFit="cover"
                    w="100%"
                    h="100%"
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    bottom="0"
                />
            </Box>
            <VStack
                w="100%"
                justifyContent={"space-between"}
                alignItems={"center"}
                pr={5}
                gap={2}
                maxW="100%"
                overflow="hidden"
            >
                <Text fontSize={"lg"} px={1} whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" width="100%">
                    {peakSignal.displayName}
                </Text>
                <HStack gap={"2px"} bg={"green.500"} fontSize="xl" px={3} borderRadius="full" color="#029E03">
                    <Text>{peakSignal.value}</Text>
                </HStack>
            </VStack>
        </HStack>
    )
}
