"use client"

import { VStack, HStack, Text, Box, Table, Image, Spinner } from "@chakra-ui/react"
import Link from "next/link"
import { Tooltip } from "../../components/ui/tooltip"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

import { useGetUsers } from "../../hooks/useGetUsers"

import { ASSETS } from "../../config/constants"

import SingleLineTextInput from "../ui/SingleLineTextInput"

const TableHeader = ({
    children,
    textAlign = "left",
    display = { base: "table-cell", sm: "table-cell" },
    maxW,
    px = { base: 0, sm: 2 },
}: {
    children: React.ReactNode
    textAlign?: "left" | "center"
    display?: { base: string; sm: string }
    maxW?: { base: string; sm: string }
    px?: { base: number; sm: number }
}) => (
    <Table.ColumnHeader
        color="textColorMuted"
        fontSize="lg"
        borderBottom="2px solid"
        borderColor="contentBorder"
        textAlign={textAlign}
        display={display}
        minW={maxW}
        maxW={maxW}
        px={px}
    >
        {children}
    </Table.ColumnHeader>
)

export default function Leaderboard({ project }: { project: ProjectData }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialSearchTerm = searchParams.get("search") || ""
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearchTerm)
    const [isSearching, setIsSearching] = useState(false)

    // Use the fuzzy search when there is a search term
    const { users, loading, error } = useGetUsers(project.urlSlug, debouncedSearchTerm, debouncedSearchTerm.length > 0)

    // Debounce the search term to avoid too many API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            // Trim whitespace from the search term
            const trimmedSearchTerm = searchTerm.trim()
            setDebouncedSearchTerm(trimmedSearchTerm)

            // Update URL with search parameter
            const url = new URL(window.location.href)
            if (trimmedSearchTerm) {
                url.searchParams.set("search", trimmedSearchTerm)
            } else {
                url.searchParams.delete("search")
            }
            router.replace(url.pathname + url.search, { scroll: false })
        }, 500) // 500ms debounce

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
    const signalColumnWidth = { base: "40px", sm: "40px" }
    const scoreColumnWidth = { base: "40px", sm: "40px" }
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
                        <TableHeader maxW={displayNameColumnWidth} px={{ base: 2, sm: 2 }}>
                            <SingleLineTextInput
                                value={searchTerm}
                                onChange={handleSearchChange}
                                handleClear={handleClearSearch}
                                placeholder="Search users..."
                            />
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
                            display={{ base: "none", sm: project.peakSignalsEnabled ? "table-cell" : "none" }}
                        >
                            Peak Signals
                        </TableHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {loading || isSearching ? (
                        <Table.Row bg="transparent">
                            <Table.Cell colSpan={5} py={0} h={"50vh"} borderColor="transparent">
                                <VStack gap={2} h={"100%"} justifyContent="start" py={10}>
                                    <Spinner size="md" />
                                </VStack>
                            </Table.Cell>
                        </Table.Row>
                    ) : users.length === 0 ? (
                        <Table.Row bg="pageBackground">
                            <Table.Cell colSpan={5} textAlign="center" py={10} borderColor="contentBorder">
                                <Text color="textColorMuted">
                                    {searchTerm ? `No users found with the name "${searchTerm}"` : "No users found"}
                                </Text>
                            </Table.Cell>
                        </Table.Row>
                    ) : (
                        users.map((user, index) => {
                            const linkUrl = `/p/${project.urlSlug}/${user.username}${window.location.search}`

                            return (
                                <Table.Row
                                    key={index}
                                    cursor="pointer"
                                    bg={"pageBackground"}
                                    _hover={{
                                        bg: "button.secondary.hover",
                                        _active: { bg: "button.secondary.active" },
                                    }}
                                    _active={{ bg: "button.secondary.active" }}
                                    transition="all 0.1s ease"
                                    borderBottom="1px solid"
                                    borderColor="contentBorder"
                                >
                                    <Table.Cell
                                        borderBottom="none"
                                        py={"6px"}
                                        px={{ base: 0, sm: 4 }}
                                        textAlign="center"
                                    >
                                        <Link href={linkUrl}>
                                            <Text fontSize="lg" fontWeight="bold" color="textColor">
                                                {user.rank}
                                            </Text>
                                        </Link>
                                    </Table.Cell>
                                    <Table.Cell borderBottom="none" py={"6px"} pr={0} maxW={displayNameColumnWidth}>
                                        <Link href={linkUrl}>
                                            <HStack gap={3}>
                                                <Box
                                                    position="relative"
                                                    boxSize="40px"
                                                    minW="40px"
                                                    borderRadius="full"
                                                    overflow="hidden"
                                                >
                                                    <Image
                                                        src={
                                                            !user.profileImageUrl || user.profileImageUrl === ""
                                                                ? ASSETS.DEFAULT_PROFILE_IMAGE
                                                                : user.profileImageUrl
                                                        }
                                                        alt={`User ${user.username} Profile Image`}
                                                        fit="cover"
                                                    />
                                                </Box>
                                                <Text fontSize="lg" color="textColor" truncate>
                                                    {user.displayName}
                                                </Text>
                                            </HStack>
                                        </Link>
                                    </Table.Cell>
                                    <Table.Cell borderBottom="none" py={0} px={0} maxW={signalColumnWidth}>
                                        <Link href={linkUrl}>
                                            <HStack
                                                justifyContent="center"
                                                alignItems="center"
                                                fontSize="xl"
                                                fontWeight="bold"
                                            >
                                                <Text color={`scoreColor.${user.signal || "textColorMuted"}`}>
                                                    {(user.signal || "").charAt(0).toUpperCase() +
                                                        (user.signal || "").slice(1)}
                                                </Text>
                                            </HStack>
                                        </Link>
                                    </Table.Cell>
                                    <Table.Cell
                                        borderBottom="none"
                                        textAlign="center"
                                        py={0}
                                        px={0}
                                        maxW={scoreColumnWidth}
                                    >
                                        <Link href={linkUrl}>
                                            <HStack justifyContent="center" alignItems="center">
                                                <Text
                                                    px={2}
                                                    py={1}
                                                    border="3px solid"
                                                    borderRadius="15px"
                                                    borderColor={`scoreColor.${user.signal || ""}`}
                                                    color="textColor"
                                                    w="fit-content"
                                                    fontSize="lg"
                                                >
                                                    {user.score}
                                                </Text>
                                            </HStack>
                                        </Link>
                                    </Table.Cell>
                                    <Table.Cell
                                        borderBottom="none"
                                        py={0}
                                        maxW={peakSignalsColumnWidth}
                                        display={{
                                            base: "none",
                                            sm: project.peakSignalsEnabled ? "table-cell" : "none",
                                        }}
                                    >
                                        <Link href={linkUrl}>
                                            <HStack justify="center" gap={2}>
                                                {[...(user.peakSignals || [])]
                                                    .sort((a, b) => b.value - a.value)
                                                    .slice(0, 5)
                                                    .map((badge, index) => (
                                                        <Tooltip
                                                            key={index}
                                                            openDelay={100}
                                                            closeDelay={0}
                                                            content={badge.displayName}
                                                            positioning={{
                                                                placement: "top",
                                                                offset: { mainAxis: 2 },
                                                            }}
                                                        >
                                                            <Image
                                                                key={index}
                                                                src={badge.imageSrc}
                                                                alt={badge.imageAlt}
                                                                width={10}
                                                                height={10}
                                                                borderRadius="full"
                                                            />
                                                        </Tooltip>
                                                    ))}
                                            </HStack>
                                        </Link>
                                    </Table.Cell>
                                </Table.Row>
                            )
                        })
                    )}
                </Table.Body>
            </Table.Root>
        </Box>
    )
}
