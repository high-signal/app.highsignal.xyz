"use client"

import { useRouter } from "next/navigation"

import { VStack, HStack, Text, Box, Button, SimpleGrid, Span, Image } from "@chakra-ui/react"

import SignalBox from "./SignalBox"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"

import operatorData from "../public/data/userData.json"

export default function SignalDisplay({ username }: { username: string }) {
    const router = useRouter()

    const data = operatorData[username as keyof typeof operatorData]
    if (!data) return <Text>{username} not found</Text>

    return (
        <Box w="100%" maxW="600px" borderRadius="20px" p={6} zIndex={10}>
            {/* Title and Signal Amount */}
            <VStack align="stretch" gap={3}>
                <HStack
                    justify="center"
                    gap={5}
                    w={"100%"}
                    justifyContent={{ base: "center", sm: "space-between" }}
                    alignItems="center"
                    pb={5}
                    wrap={"wrap"}
                >
                    <HStack>
                        <Button size="sm" borderRadius="8px" onClick={() => router.back()}>
                            <HStack gap={2}>
                                <FontAwesomeIcon icon={faArrowLeft} />
                                <Text>Back</Text>
                            </HStack>
                        </Button>
                        <HStack
                            bg="gray.800"
                            py={2}
                            pl={2}
                            pr={4}
                            borderRadius="12px"
                            border={"2px solid"}
                            borderColor="gray.500"
                        >
                            <Box position="relative" boxSize="40px" borderRadius="full" overflow="hidden">
                                <Image src={data.operatorImage} alt={`Operator ${data.operatorNumber}`} fit="cover" />
                            </Box>
                            <Text fontSize="xl" fontWeight={"bold"}>
                                {data.name}
                            </Text>
                        </HStack>
                    </HStack>

                    <HStack
                        bg="gray.800"
                        py={2}
                        px={3}
                        borderRadius="12px"
                        border={"2px solid"}
                        borderColor="gray.500"
                        h={"60px"}
                    >
                        <Text fontSize="xl" fontWeight={"bold"}>
                            Lido CSM Operator {data.operatorNumber}
                        </Text>
                    </HStack>
                </HStack>

                <HStack
                    justifyContent={"center"}
                    alignItems={"center"}
                    gap={5}
                    fontSize={{ base: "40px", sm: "50px" }}
                    fontWeight="bold"
                    pb={2}
                >
                    <Text textAlign={"center"}>
                        <Span color={data.signalColor}>{data.signal}</Span> Signal
                    </Text>
                    <Text px={4} py={0} border={"5px solid"} borderRadius="25px" borderColor={data.signalColor}>
                        {data.signalValue}
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
                        <Text fontSize="20px" w={"15%"} textAlign="center" fontWeight="bold" color={data.signalColor}>
                            High
                        </Text>
                    </HStack>
                    <HStack
                        gap={0}
                        h={"35px"}
                        w={"100%"}
                        border={"3px solid"}
                        borderRadius={"10px"}
                        borderColor={"gray.600"}
                        overflow={"hidden"}
                        position="relative"
                    >
                        <Box
                            bg="gray.800"
                            w={`${data.signalValue}%`}
                            h={"100%"}
                            textAlign="center"
                            borderRight={"3px solid"}
                            borderColor={data.signalColor}
                        />
                        <Box
                            position="absolute"
                            left="20%"
                            top="0"
                            bottom="0"
                            borderLeft="2px dashed"
                            borderColor="gray.600"
                        />
                        <Box
                            position="absolute"
                            left="50%"
                            top="0"
                            bottom="0"
                            borderLeft="2px dashed"
                            borderColor="gray.600"
                        />
                        <Box
                            position="absolute"
                            left="85%"
                            top="0"
                            bottom="0"
                            borderLeft="2px dashed"
                            borderColor="gray.600"
                        />
                    </HStack>
                </VStack>

                {/* High Signals Section */}
                <Text fontSize="xl" fontWeight={"bold"}>
                    Peak Signals
                </Text>

                <SimpleGrid columns={3} gap={4} mb={8}>
                    {data.peakSignals.map((signal, index) => (
                        <SignalBox
                            key={index}
                            imageSrc={signal.imageSrc}
                            imageAlt={signal.imageAlt}
                            title={signal.title}
                            value={signal.value}
                        />
                    ))}
                </SimpleGrid>

                {/* Signal Strength Section */}
                <Text fontSize="xl" fontWeight={"bold"}>
                    Signal Strength
                </Text>

                <VStack gap={10} alignItems={"start"} w={"100%"}>
                    {/* Validator Count */}
                    <VStack alignItems={"start"} gap={3} w={"100%"}>
                        <HStack alignItems={"baseline"}>
                            <Text fontSize="lg">Validator Count</Text>
                            <Text bg={"green.500"} fontSize="xl" px={2} borderRadius="8px">
                                {data.metrics.validatorCount.value}
                            </Text>
                        </HStack>
                        <Box w="100%" h="20px" bg="gray.800" borderRadius="md" overflow="hidden">
                            <Box w={data.metrics.validatorCount.percentage} h="100%" bg="blue.500" />
                        </Box>
                    </VStack>

                    {/* Lido Forum Engagement */}
                    <VStack alignItems={"start"} gap={3} w={"100%"}>
                        <HStack alignItems={"baseline"}>
                            <Text fontSize="lg">Lido Forum Engagement</Text>
                            <Text bg={"green.500"} fontSize="xl" px={2} borderRadius="8px">
                                {data.metrics.lidoForumEngagement.value}
                            </Text>
                        </HStack>
                        <Box w="100%" h="20px" bg="gray.800" borderRadius="md" overflow="hidden">
                            <Box w={data.metrics.lidoForumEngagement.percentage} h="100%" bg="blue.500" />
                        </Box>
                    </VStack>

                    {/* X Engagement */}
                    <VStack alignItems={"start"} gap={3} w={"100%"}>
                        <HStack>
                            <HStack alignItems={"baseline"} gap={{ base: 0, sm: 4 }} wrap={"wrap"}>
                                <HStack alignItems={"baseline"}>
                                    <Text fontSize="lg">X Engagement</Text>
                                    <Text bg={data.metrics.xEngagement.color} fontSize="xl" px={2} borderRadius="8px">
                                        {data.metrics.xEngagement.value}
                                    </Text>
                                </HStack>
                                <HStack gap={1} color="yellow.400" alignItems={"baseline"}>
                                    <Box fontSize="xl">
                                        <FontAwesomeIcon icon={faExclamationTriangle} />
                                    </Box>
                                    <Text>{data.metrics.xEngagement.warning}</Text>
                                </HStack>
                            </HStack>
                        </HStack>
                        <Box w="100%" h="20px" bg="gray.800" borderRadius="md" overflow="hidden">
                            <Box w={data.metrics.xEngagement.percentage} h="100%" bg="red.700" />
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
                            <Button size="sm" borderRadius="8px">
                                Connect
                            </Button>
                        </HStack>
                        <Box w="100%" h="20px" bg="gray.800" borderRadius="md" />
                    </VStack>
                </VStack>
            </VStack>
        </Box>
    )
}
