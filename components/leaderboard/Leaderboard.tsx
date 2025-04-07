"use client"

import { VStack, HStack, Text, Box, Table, Image, Spinner, Input } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useGetUsers } from "../../hooks/useGetUsers"

const TableHeader = ({
    children,
    textAlign = "left",
    display = { base: "table-cell", md: "table-cell" },
}: {
    children: React.ReactNode
    textAlign?: "left" | "center"
    display?: { base: string; md: string }
}) => (
    <Table.ColumnHeader
        color="gray.200"
        fontSize="lg"
        borderBottom="2px solid"
        borderColor="gray.500"
        textAlign={textAlign}
        display={display}
    >
        {children}
    </Table.ColumnHeader>
)

export default function Leaderboard({ project }: { project: string }) {
    const router = useRouter()
    const { users, loading, error } = useGetUsers(project)

    if (loading) {
        return (
            <VStack gap={10} w="100%" h="100%" justifyContent="center" alignItems="center" borderRadius="20px">
                <Spinner size="lg" />
            </VStack>
        )
    }

    if (error) {
        return (
            <VStack gap={10} w="100%" maxW="800px" borderRadius="20px">
                <Text color="red.500">Error: {error}</Text>
            </VStack>
        )
    }

    return (
        <Box w={"100%"} px={{ base: 3, md: 6 }}>
            <Table.Root>
                <Table.Header>
                    <Table.Row bg="transparent">
                        <TableHeader>
                            <Box>
                                <Input
                                    type="text"
                                    placeholder="Search (Coming soon...)"
                                    borderRadius="full"
                                    border={"2px solid"}
                                    borderColor="gray.800"
                                    _focus={{
                                        borderColor: "gray.500",
                                        boxShadow: "none",
                                        outline: "none",
                                    }}
                                />
                            </Box>
                        </TableHeader>
                        <TableHeader textAlign="center">Signal</TableHeader>
                        <TableHeader textAlign="center">Score</TableHeader>
                        <TableHeader textAlign="center" display={{ base: "none", md: "table-cell" }}>
                            Peak Signals
                        </TableHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {users.map((user, index) => (
                        <Table.Row
                            key={index}
                            cursor="pointer"
                            bg="transparent"
                            _hover={{ bg: "gray.800" }}
                            transition="background-color 0.2s"
                            onClick={() => router.push(`/${project}/${user.username}`)}
                            borderBottom="1px solid"
                            borderColor="gray.500"
                        >
                            <Table.Cell borderBottom="none" py={"6px"}>
                                <HStack gap={3}>
                                    <Box position="relative" boxSize="40px" borderRadius="full" overflow="hidden">
                                        <Image
                                            src={user.profileImageUrl}
                                            alt={`Operator ${user.profileImageUrl}`}
                                            fit="cover"
                                        />
                                    </Box>
                                    <Text fontSize="lg" color="white">
                                        {user.displayName}
                                    </Text>
                                </HStack>
                            </Table.Cell>
                            <Table.Cell borderBottom="none" py={0}>
                                <HStack justifyContent="center" alignItems="center" fontSize="xl" fontWeight="bold">
                                    <Text color={`scoreColor.${user.signal}`}>
                                        {user.signal.charAt(0).toUpperCase() + user.signal.slice(1)}
                                    </Text>
                                </HStack>
                            </Table.Cell>
                            <Table.Cell borderBottom="none" textAlign="center" py={0}>
                                <HStack justifyContent="center" alignItems="center">
                                    <Text
                                        px={2}
                                        py={1}
                                        border="3px solid"
                                        borderRadius="15px"
                                        borderColor={`scoreColor.${user.signal}`}
                                        color="white"
                                        w="fit-content"
                                        fontSize="lg"
                                    >
                                        {user.score}
                                    </Text>
                                </HStack>
                            </Table.Cell>
                            <Table.Cell borderBottom="none" py={0} display={{ base: "none", md: "table-cell" }}>
                                <HStack justify="center" gap={2}>
                                    {user.peakSignals.map((badge, index) => (
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
    )
}
