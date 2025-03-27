import { VStack, HStack, Text, Box, Button, SimpleGrid, Icon } from "@chakra-ui/react"
import { BsMegaphone } from "react-icons/bs"
import { FaExclamationTriangle } from "react-icons/fa"
import Image from "next/image"

export default function SignalDisplay() {
    return (
        <Box w="100%" maxW="600px" bg="contentBackground" borderRadius="xl" p={6} zIndex={10}>
            {/* Title and Signal Amount */}
            <VStack align="stretch" gap={4}>
                <HStack justify="center" gap={2}>
                    <Text fontSize="2xl">CSM Signal - Operator 10</Text>
                </HStack>

                <HStack justify="center" gap={2}>
                    <Icon as={BsMegaphone} color="yellow.400" />
                    <Text fontSize="3xl" fontWeight="bold">
                        7,320.23
                    </Text>
                </HStack>

                {/* Current Signal Bonus */}
                <Box bg="green.600" p={2} borderRadius="md" textAlign="center">
                    <Text>Current Signal Bonus x1.65</Text>
                </Box>

                {/* Baseline Signal */}
                <Text color="gray.300">Baseline Signal: 1 per second for being a CSM operator</Text>

                {/* High Signals Section */}
                <Text color="red.300" fontSize="xl">
                    High Signals
                </Text>

                <SimpleGrid columns={3} gap={4}>
                    <Box bg="blue.800" p={4} borderRadius="md" textAlign="center">
                        <VStack>
                            <Text fontSize="sm">Testnet Pioneer</Text>
                            <HStack>
                                <Box position="relative" boxSize="80px" borderRadius="10px" overflow="hidden">
                                    <Image src="/static/testnet-pioneer.png" alt="Testnet Pioneer" layout="fill" />
                                </Box>
                                <Text color="green.400">+0.1</Text>
                            </HStack>
                        </VStack>
                    </Box>
                    <Box bg="blue.800" p={4} borderRadius="md" textAlign="center">
                        <VStack>
                            <Box position="relative" w="40px" h="40px">
                                <Image src="/static/keen-bean.png" alt="Day 1 Keen Bean" layout="fill" />
                            </Box>
                            <Text color="green.400">+0.2</Text>
                            <Text fontSize="sm">Day 1 Keen Bean</Text>
                        </VStack>
                    </Box>
                    <Box bg="blue.800" p={4} borderRadius="md" textAlign="center">
                        <VStack>
                            <Box position="relative" w="40px" h="40px">
                                <Image
                                    src="/static/one-month-participant.png"
                                    alt="1 month participant"
                                    layout="fill"
                                />
                            </Box>
                            <Text color="green.400">+0.05</Text>
                            <Text fontSize="sm">1 month participant</Text>
                        </VStack>
                    </Box>
                </SimpleGrid>

                {/* Signal Strength Section */}
                <Text fontSize="xl" color="pink.300">
                    Signal Strength (Past 30 days)
                </Text>

                {/* Validator Count */}
                <VStack align="stretch" gap={2}>
                    <Text color="blue.300">Highest Validator Count</Text>
                    <HStack gap={2}>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                            <Box
                                key={num}
                                bg="blue.600"
                                w="30px"
                                h="30px"
                                borderRadius="full"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                {num}
                            </Box>
                        ))}
                        <Text color="green.400">+0.1</Text>
                    </HStack>
                </VStack>

                {/* Lido Forum Engagement */}
                <VStack align="stretch" gap={2}>
                    <Text color="blue.300">Lido Forum Engagement</Text>
                    <HStack>
                        <Box w="100%" h="8px" bg="blue.900" borderRadius="md" overflow="hidden">
                            <Box w="70%" h="100%" bg="blue.500" />
                        </Box>
                        <Text color="green.400">+0.2</Text>
                    </HStack>
                </VStack>

                {/* X Engagement */}
                <VStack align="stretch" gap={2}>
                    <HStack>
                        <Text color="blue.300">X Engagement</Text>
                        <Icon as={FaExclamationTriangle} color="yellow.400" />
                        <Text color="yellow.400" fontSize="sm">
                            Low quality spam posts
                        </Text>
                    </HStack>
                    <HStack>
                        <Box w="100%" h="8px" bg="blue.900" borderRadius="md" overflow="hidden">
                            <Box w="85%" h="100%" bg="blue.500" />
                        </Box>
                        <Text color="orange.400">-0.5</Text>
                    </HStack>
                </VStack>

                {/* Farcaster Engagement */}
                <VStack align="stretch" gap={2}>
                    <Text color="blue.300">Farcaster Engagement</Text>
                    <HStack>
                        <Box w="100%" h="8px" bg="blue.900" borderRadius="md" />
                        <Button size="sm" colorScheme="blue">
                            Connect
                        </Button>
                    </HStack>
                </VStack>
            </VStack>
        </Box>
    )
}
