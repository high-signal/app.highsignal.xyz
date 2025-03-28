"use client"

import { VStack, HStack, Text, Box, Table, Image } from "@chakra-ui/react"
import Link from "next/link"
import SignalBox from "./SignalBox"
import operatorData from "../public/data/userData.json"

export default function Leaderboard() {
    return (
        <Box w="100%" maxW="800px" borderRadius="20px" p={6} zIndex={10}>
            <Text fontSize="3xl" fontWeight="bold" mb={6} w="100%" textAlign="center">
                Leaderboard
            </Text>

            <Box bg="gray.800" borderRadius="20px" overflow="hidden">
                <Table.Root variant="line" size="lg">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeader
                                bg="gray.800"
                                color="gray.300"
                                fontSize="lg"
                                borderBottom="2px solid"
                                borderColor="gray.500"
                            >
                                User
                            </Table.ColumnHeader>
                            <Table.ColumnHeader
                                bg="gray.800"
                                color="gray.300"
                                fontSize="lg"
                                borderBottom="2px solid"
                                borderColor="gray.500"
                                textAlign="center"
                            >
                                Signal
                            </Table.ColumnHeader>
                            <Table.ColumnHeader
                                bg="gray.800"
                                color="gray.300"
                                fontSize="lg"
                                borderBottom="2px solid"
                                borderColor="gray.500"
                                textAlign="center"
                            >
                                Score
                            </Table.ColumnHeader>
                            <Table.ColumnHeader
                                bg="gray.800"
                                color="gray.300"
                                fontSize="lg"
                                borderBottom="2px solid"
                                borderColor="gray.500"
                                textAlign="center"
                            >
                                Badges
                            </Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {Object.entries(operatorData).map(([username, data], index) => (
                            <Table.Row
                                key={username}
                                cursor="pointer"
                                bg={index % 2 === 0 ? "gray.800" : "gray.900"}
                                _hover={{ bg: "gray.600" }}
                                transition="background-color 0.2s"
                                onClick={() => (window.location.href = `/${username}`)}
                            >
                                <Table.Cell borderBottom="none">
                                    <HStack gap={3}>
                                        <Box position="relative" boxSize="40px" borderRadius="full" overflow="hidden">
                                            <Image
                                                src={data.operatorImage}
                                                alt={`Operator ${data.operatorNumber}`}
                                                fit="cover"
                                            />
                                        </Box>
                                        <Text fontSize="lg" color="white">
                                            {data.name}
                                        </Text>
                                    </HStack>
                                </Table.Cell>
                                <Table.Cell borderBottom="none">
                                    <HStack justifyContent="center" alignItems="center" fontSize="xl" fontWeight="bold">
                                        <Text color={data.signalColor}>{data.signal}</Text>
                                    </HStack>
                                </Table.Cell>
                                <Table.Cell borderBottom="none" textAlign="center">
                                    <HStack justifyContent="center" alignItems="center">
                                        <Text
                                            px={3}
                                            py={1}
                                            border="3px solid"
                                            borderRadius="15px"
                                            borderColor={data.signalColor}
                                            color="white"
                                            w="fit-content"
                                        >
                                            {data.signalValue}
                                        </Text>
                                    </HStack>
                                </Table.Cell>
                                <Table.Cell borderBottom="none">
                                    <HStack justify="center" gap={2}>
                                        {data.peakSignals.map((badge, index) => (
                                            <Image
                                                key={index}
                                                src={badge.imageSrc}
                                                alt={badge.imageAlt}
                                                width={10}
                                                height={10}
                                                borderRadius="5px"
                                            />
                                        ))}
                                    </HStack>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            </Box>
        </Box>
    )
}
