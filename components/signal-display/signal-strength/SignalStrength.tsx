import { HStack, VStack, Box, Text } from "@chakra-ui/react"

export default function SignalStrength({ data }: { data: SignalStrengthData }) {
    const percentageCompleted = (Number(data.value) / Number(data.maxValue)) * 100
    const completedBarWidth = percentageCompleted > 100 ? "100%" : `${percentageCompleted}%`

    return (
        <VStack alignItems={"start"} gap={3} w={"100%"}>
            <HStack alignItems={"baseline"}>
                <Text fontSize="lg">{data.displayName}</Text>
                <Text bg={"green.500"} fontSize="xl" px={2} borderRadius="8px" color="#029E03">
                    {data.value}
                </Text>
            </HStack>
            <Box w="100%" h="26px" bg="gray.800" borderRadius="md" overflow="hidden">
                <Box w={completedBarWidth} h="100%" bg="green.500" borderRight={"2px solid"} borderColor="#029E03" />
            </Box>
        </VStack>
    )
}
