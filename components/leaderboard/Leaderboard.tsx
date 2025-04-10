"use client"

import { VStack, HStack, Text, Box, Table, Image, Spinner, Input } from "@chakra-ui/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useGetUsers } from "../../hooks/useGetUsers"
import { useState, useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons"

const TableHeader = ({
    children,
    textAlign = "left",
    display = { base: "table-cell", sm: "table-cell" },
    maxW,
    px = { base: 2, sm: 4 },
}: {
    children: React.ReactNode
    textAlign?: "left" | "center"
    display?: { base: string; sm: string }
    maxW?: { base: string; sm: string }
    px?: { base: number; sm: number }
}) => (
    <Table.ColumnHeader
        color="gray.200"
        fontSize="lg"
        borderBottom="2px solid"
        borderColor="gray.500"
        textAlign={textAlign}
        display={display}
        minW={maxW}
        maxW={maxW}
        px={px}
    >
        {children}
    </Table.ColumnHeader>
)

export default function Leaderboard({ project }: { project: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialSearchTerm = searchParams.get("search") || ""
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearchTerm)
    const [isSearching, setIsSearching] = useState(false)

    // Use the fuzzy search when there is a search term
    const { users, loading, error } = useGetUsers(project, debouncedSearchTerm, debouncedSearchTerm.length > 0)

    // Debounce the search term to avoid too many API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)

            // Update URL with search parameter
            const url = new URL(window.location.href)
            if (searchTerm) {
                url.searchParams.set("search", searchTerm)
            } else {
                url.searchParams.delete("search")
            }
            router.replace(url.pathname + url.search, { scroll: false })
        }, 300) // 300ms debounce

        return () => clearTimeout(timer)
    }, [searchTerm, router])

    // Set isSearching to false when loading completes
    useEffect(() => {
        if (!loading) {
            setIsSearching(false)
        }
    }, [loading])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        setIsSearching(true)
    }

    const handleClearSearch = () => {
        setSearchTerm("")
        setIsSearching(true)
    }

    if (error) {
        return (
            <VStack gap={10} w="100%" maxW="800px" borderRadius="20px">
                <Text color="red.500">Error: {error}</Text>
            </VStack>
        )
    }

    const rankColumnWidth = { base: "20px", sm: "50px" }
    const displayNameColumnWidth = { base: "120px", sm: "auto" }
    const signalColumnWidth = { base: "50px", sm: "80px" }
    const scoreColumnWidth = { base: "50px", sm: "80px" }
    const peakSignalsColumnWidth = { base: "100px", sm: "100px" }

    return (
        <Box w={"100%"} px={{ base: 3, sm: 6 }}>
            <Table.Root>
                <Table.Header>
                    <Table.Row bg="transparent">
                        <TableHeader textAlign="center" maxW={rankColumnWidth}>
                            <HStack justifyContent="center">
                                <Text display={{ base: "block", sm: "none" }}>#</Text>
                                <Text display={{ base: "none", sm: "block" }}>Rank</Text>
                            </HStack>
                        </TableHeader>
                        <TableHeader maxW={displayNameColumnWidth} px={{ base: 2, sm: 4 }}>
                            <Box position="relative">
                                <Input
                                    type="text"
                                    fontSize="md"
                                    placeholder="Search users..."
                                    borderRadius="full"
                                    border={"2px solid"}
                                    borderColor="gray.800"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    _focus={{
                                        borderColor: "gray.300",
                                        boxShadow: "none",
                                        outline: "none",
                                    }}
                                    _selection={{
                                        bg: "gray.600",
                                        color: "white",
                                    }}
                                    bg={searchTerm ? "gray.800" : "transparent"}
                                    pr="30px"
                                    h="35px"
                                />
                                {searchTerm && (
                                    <Box
                                        position="absolute"
                                        right="5px"
                                        top="50%"
                                        transform="translateY(-50%)"
                                        cursor="pointer"
                                        onClick={handleClearSearch}
                                        color="gray.200"
                                        _hover={{ color: "white" }}
                                    >
                                        <FontAwesomeIcon icon={faCircleXmark} size="lg" />
                                    </Box>
                                )}
                            </Box>
                        </TableHeader>
                        <TableHeader textAlign="center" maxW={signalColumnWidth}>
                            Signal
                        </TableHeader>
                        <TableHeader textAlign="center" maxW={scoreColumnWidth}>
                            Score
                        </TableHeader>
                        <TableHeader
                            textAlign="center"
                            maxW={peakSignalsColumnWidth}
                            display={{ base: "none", sm: "table-cell" }}
                        >
                            Peak Signals
                        </TableHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {loading || isSearching ? (
                        <Table.Row>
                            <Table.Cell colSpan={5} py={0} h={"50vh"}>
                                <VStack gap={2} h={"100%"} justifyContent="start" py={10}>
                                    <Spinner size="md" />
                                </VStack>
                            </Table.Cell>
                        </Table.Row>
                    ) : users.length === 0 ? (
                        <Table.Row>
                            <Table.Cell colSpan={5} textAlign="center" py={10}>
                                <Text color="gray.400">
                                    {searchTerm ? `No users found with the name "${searchTerm}"` : "No users found"}
                                </Text>
                            </Table.Cell>
                        </Table.Row>
                    ) : (
                        users.map((user, index) => (
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
                                <Table.Cell borderBottom="none" py={"6px"} px={{ base: 0, sm: 4 }} textAlign="center">
                                    <Text fontSize="lg" fontWeight="bold" color="white">
                                        {user.rank}
                                    </Text>
                                </Table.Cell>
                                <Table.Cell borderBottom="none" py={"6px"} maxW={displayNameColumnWidth}>
                                    <HStack gap={3}>
                                        <Box position="relative" boxSize="40px" borderRadius="full" overflow="hidden">
                                            <Image
                                                src={user.profileImageUrl}
                                                alt={`Operator ${user.profileImageUrl}`}
                                                fit="cover"
                                            />
                                        </Box>
                                        <Text fontSize="lg" color="white" truncate>
                                            {user.displayName}
                                        </Text>
                                    </HStack>
                                </Table.Cell>
                                <Table.Cell borderBottom="none" py={0} maxW={signalColumnWidth}>
                                    <HStack justifyContent="center" alignItems="center" fontSize="xl" fontWeight="bold">
                                        <Text color={`scoreColor.${user.signal}`}>
                                            {user.signal.charAt(0).toUpperCase() + user.signal.slice(1)}
                                        </Text>
                                    </HStack>
                                </Table.Cell>
                                <Table.Cell borderBottom="none" textAlign="center" py={0} maxW={scoreColumnWidth}>
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
                                <Table.Cell
                                    borderBottom="none"
                                    py={0}
                                    maxW={peakSignalsColumnWidth}
                                    display={{ base: "none", sm: "table-cell" }}
                                >
                                    <HStack justify="center" gap={2}>
                                        {[...user.peakSignals]
                                            .sort((a, b) => b.value - a.value)
                                            .slice(0, 5)
                                            .map((badge, index) => (
                                                <Image
                                                    key={index}
                                                    src={badge.imageSrc}
                                                    alt={badge.imageAlt}
                                                    width={10}
                                                    height={10}
                                                    borderRadius="full"
                                                />
                                            ))}
                                    </HStack>
                                </Table.Cell>
                            </Table.Row>
                        ))
                    )}
                </Table.Body>
            </Table.Root>
        </Box>
    )
}
