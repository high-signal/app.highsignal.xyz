import { HStack, VStack, Box, Text } from "@chakra-ui/react"

interface SignalStrengthProps {
    metrics: {
        lidoProtocolEngagement: {
            value: string
            percentage: string
        }
    }
}

export default function SignalStrength({ metrics }: SignalStrengthProps) {
    return (
        <VStack alignItems={"start"} gap={3} w={"100%"}>
            <HStack alignItems={"baseline"}>
                <Text fontSize="lg">Protocol Engagement</Text>
                <Text bg={"green.500"} fontSize="xl" px={2} borderRadius="8px" color="#029E03">
                    {metrics.lidoProtocolEngagement.value}
                </Text>
            </HStack>
            <Box w="100%" h="26px" bg="gray.800" borderRadius="md" overflow="hidden">
                <Box
                    w={metrics.lidoProtocolEngagement.percentage}
                    h="100%"
                    bg="green.500"
                    borderRight={"2px solid"}
                    borderColor="#029E03"
                />
            </Box>
        </VStack>
    )
}
