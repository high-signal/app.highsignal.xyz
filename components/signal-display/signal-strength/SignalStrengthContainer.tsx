import { VStack, HStack, Text, Box, Button } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"

export default function SignalStrengthContainer({ metrics }: SignalStrengthContainerProps) {
    return (
        <VStack gap={3} w="100%" alignItems={"start"}>
            <Text fontSize="xl" fontWeight={"bold"}>
                📶 Signal Strength
            </Text>

            <VStack gap={10} alignItems={"start"} w={"100%"}>
                {/* Protocol Engagement */}
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

                {/* Forum Engagement */}
                <VStack alignItems={"start"} gap={3} w={"100%"}>
                    <HStack alignItems={"baseline"}>
                        <Text fontSize="lg">Forum Engagement</Text>
                        <Text bg={"green.500"} fontSize="xl" px={2} borderRadius="8px" color="#029E03">
                            {metrics.lidoForumEngagement.value}
                        </Text>
                    </HStack>
                    <Box w="100%" h="26px" bg="gray.800" borderRadius="md" overflow="hidden">
                        <Box
                            w={metrics.lidoForumEngagement.percentage}
                            h="100%"
                            bg="green.500"
                            borderRight={"2px solid"}
                            borderColor="#029E03"
                        />
                    </Box>
                </VStack>

                {/* X Engagement */}
                <VStack alignItems={"start"} gap={3} w={"100%"}>
                    <HStack>
                        <HStack alignItems={"baseline"} gap={{ base: 0, sm: 4 }} wrap={"wrap"}>
                            <HStack alignItems={"baseline"}>
                                <Text fontSize="lg">X Engagement</Text>
                                <Text bg={"red.500"} fontSize="xl" px={2} borderRadius="8px" color="#EC420C">
                                    {metrics.xEngagement.value}
                                </Text>
                            </HStack>
                            <HStack gap={1} color="yellow.400" alignItems={"baseline"}>
                                <Box fontSize="xl">
                                    <FontAwesomeIcon icon={faExclamationTriangle} />
                                </Box>
                                <Text>{metrics.xEngagement.warning}</Text>
                            </HStack>
                        </HStack>
                    </HStack>
                    <Box w="100%" h="26px" bg="gray.800" borderRadius="md" overflow="hidden">
                        <Box
                            w={metrics.xEngagement.percentage}
                            h="100%"
                            bg="red.500"
                            borderRight={"2px solid"}
                            borderColor="#EC420C"
                        />
                    </Box>
                </VStack>

                {/* Farcaster Engagement */}
                <VStack alignItems={"start"} w={"100%"}>
                    <HStack justifyContent={"space-between"} alignItems={"baseline"} w={"100%"}>
                        <HStack alignItems={"baseline"}>
                            <Text fontSize="lg">Farcaster Engagement</Text>
                            <Text bg={"gray.800"} fontSize="xl" px={2} borderRadius="8px">
                                0
                            </Text>
                        </HStack>
                        <Button size="sm" borderRadius="8px" disabled>
                            Connect - Coming Soon!
                        </Button>
                    </HStack>
                    <Box w="100%" h="26px" bg="gray.800" borderRadius="md" />
                </VStack>
            </VStack>
        </VStack>
    )
}
