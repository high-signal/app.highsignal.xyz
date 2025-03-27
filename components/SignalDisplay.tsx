import { VStack, HStack, Text, Box, Button, SimpleGrid, Icon } from "@chakra-ui/react"
import { BsMegaphone } from "react-icons/bs"
import { FaExclamationTriangle } from "react-icons/fa"
import Image from "next/image"
import SignalBox from "./SignalBox"

export default function SignalDisplay() {
    return (
        <Box w="100%" maxW="600px" bg="contentBackground" borderRadius="20px" p={6} zIndex={10}>
            {/* Title and Signal Amount */}
            <VStack align="stretch" gap={3}>
                <HStack justify="center" gap={2} w={"100%"} justifyContent={"space-between"} pb={5}>
                    <HStack bg="blue.800" py={2} pl={2} pr={4} borderRadius="12px">
                        <Box position="relative" boxSize="40px" borderRadius="full" overflow="hidden">
                            <Image src="/static/operator-10.png" alt="Operator 10" layout="fill" />
                        </Box>
                        <Text fontSize="xl" fontWeight={"bold"}>
                            Eridian
                        </Text>
                    </HStack>
                    <HStack bg="blue.800" py={2} px={3} borderRadius="12px">
                        <Text fontSize="xl" fontWeight={"bold"}>
                            Lido CSM - Operator 10
                        </Text>
                    </HStack>
                </HStack>

                <HStack
                    justifyContent={"center"}
                    alignItems={"center"}
                    gap={5}
                    fontSize="50px"
                    fontWeight="bold"
                    pb={2}
                >
                    <Text textAlign={"center"}>High Signal</Text>
                    <Text px={4} py={0} border={"5px solid"} borderRadius="25px" borderColor="gold.500">
                        87
                    </Text>
                </HStack>

                {/* Current Signal */}
                <VStack align="stretch" gap={1} pb={8}>
                    <HStack gap={0} h={"30px"} w={"100%"}>
                        <Text fontSize="20px" w={"20%"} textAlign="center">
                            Low
                        </Text>
                        <Text fontSize="20px" w={"30%"} textAlign="center">
                            Mid
                        </Text>
                        <Text fontSize="20px" w={"35%"} textAlign="center">
                            Strong
                        </Text>
                        <Text fontSize="20px" w={"15%"} textAlign="center" fontWeight="bold">
                            High
                        </Text>
                    </HStack>
                    <HStack
                        gap={0}
                        h={"35px"}
                        w={"100%"}
                        border={"3px solid"}
                        borderRadius={"10px"}
                        borderColor={"blue.600"}
                        overflow={"hidden"}
                        position="relative"
                    >
                        <Box bg="blue.900" w={"87%"} h={"100%"} textAlign="center" />
                        <Box
                            position="absolute"
                            left="20%"
                            top="0"
                            bottom="0"
                            borderLeft="2px dashed"
                            borderColor="blue.600"
                        />
                        <Box
                            position="absolute"
                            left="50%"
                            top="0"
                            bottom="0"
                            borderLeft="2px dashed"
                            borderColor="blue.600"
                        />
                        <Box
                            position="absolute"
                            left="85%"
                            top="0"
                            bottom="0"
                            borderLeft="2px dashed"
                            borderColor="blue.600"
                        />
                    </HStack>
                </VStack>

                {/* High Signals Section */}
                <Text fontSize="xl" fontWeight={"bold"}>
                    Peak Signals
                </Text>

                <SimpleGrid columns={3} gap={4} mb={8}>
                    <SignalBox
                        imageSrc="/static/testnet-pioneer.png"
                        imageAlt="Testnet Pioneer"
                        title="Testnet Pioneer"
                        value="+10"
                    />
                    <SignalBox
                        imageSrc="/static/keen-bean.png"
                        imageAlt="Day 1 Keen Bean"
                        title="Day 1 Keen Bean"
                        value="+20"
                    />
                    <SignalBox
                        imageSrc="/static/one-month-participant.png"
                        imageAlt="1 month participant"
                        title="1 month Running"
                        value="+5"
                    />
                </SimpleGrid>

                {/* Signal Strength Section */}
                <Text fontSize="xl" fontWeight={"bold"}>
                    Signal Strength (Past 30 days)
                </Text>

                <VStack gap={10} alignItems={"start"} w={"100%"}>
                    {/* Validator Count */}
                    <VStack alignItems={"start"} gap={0} w={"100%"}>
                        <HStack alignItems={"baseline"}>
                            <Text fontSize="lg">Highest Validator Count</Text>
                            <Text bg={"green.500"} fontSize="xl" px={2} borderRadius="8px" mb={3}>
                                +25
                            </Text>
                        </HStack>
                        <HStack gap={2}>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                                <Box
                                    key={num}
                                    // bg="blue.600"
                                    border={"3px solid"}
                                    borderColor="blue.600"
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
                        </HStack>
                    </VStack>

                    {/* Lido Forum Engagement */}
                    <VStack alignItems={"start"} gap={0} w={"100%"}>
                        <HStack alignItems={"baseline"}>
                            <Text fontSize="lg">Lido Forum Engagement</Text>
                            <Text bg={"green.500"} fontSize="xl" px={2} borderRadius="8px" mb={3}>
                                +37
                            </Text>
                        </HStack>
                        <Box w="100%" h="20px" bg="blue.900" borderRadius="md" overflow="hidden">
                            <Box w="70%" h="100%" bg="blue.500" />
                        </Box>
                    </VStack>

                    {/* X Engagement */}
                    <VStack alignItems={"start"} gap={0} w={"100%"}>
                        <HStack>
                            <HStack alignItems={"baseline"}>
                                <Text fontSize="lg">X Engagement</Text>
                                <Text bg={"red.500"} fontSize="xl" px={2} borderRadius="8px" mb={3}>
                                    -10
                                </Text>
                                <Icon as={FaExclamationTriangle} color="yellow.400" />
                                <Text color="yellow.400" fontSize="sm">
                                    Low quality spam posts
                                </Text>
                            </HStack>
                        </HStack>
                        <Box w="100%" h="20px" bg="blue.900" borderRadius="md" overflow="hidden">
                            <Box w="15%" h="100%" bg="red.800" />
                        </Box>
                    </VStack>

                    {/* Farcaster Engagement */}
                    <VStack alignItems={"start"} w={"100%"}>
                        <HStack>
                            <Text fontSize="lg">Farcaster Engagement</Text>
                            <Button size="sm" borderRadius="8px">
                                Connect
                            </Button>
                        </HStack>
                        <Box w="100%" h="20px" bg="blue.900" borderRadius="md" />
                    </VStack>
                </VStack>
            </VStack>
        </Box>
    )
}
