"use client"

import { VStack, HStack, Text, Box, Table, Image, Spinner } from "@chakra-ui/react"
import Link from "next/link"
import { Tooltip } from "../../components/ui/tooltip"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

import { useUser } from "../../contexts/UserContext"

import { useGetUsers } from "../../hooks/useGetUsers"
import { useGetProjects } from "../../hooks/useGetProjects"

import { ASSETS } from "../../config/constants"

import SingleLineTextInput from "../ui/SingleLineTextInput"
import LeaderboardPagination from "./LeaderboardPagination"

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
        whiteSpace="nowrap"
    >
        {children}
    </Table.ColumnHeader>
)

export default function Leaderboard({
    project,
    mode = "users",
    data,
}: {
    project?: ProjectData
    mode?: "users" | "projects"
    data?: UserData[]
}) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialSearchTerm = searchParams.get("search") || ""
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearchTerm)
    const [isSearching, setIsSearching] = useState(false)

    const [resultsPage, setResultsPage] = useState(parseInt(searchParams.get("page") || "1"))
    const [maxResultsPage, setMaxResultsPage] = useState(1)

    const { loggedInUser } = useUser()
    // Use the appropriate hook based on mode
    const {
        users,
        maxPage: usersMaxPage,
        loading: usersLoading,
        error: usersError,
    } = useGetUsers({
        project: project?.urlSlug,
        username: debouncedSearchTerm,
        fuzzy: debouncedSearchTerm.length > 0,
        shouldFetch: mode === "users",
        isSuperAdminRequesting: false,
        isRawData: false,
        page: resultsPage,
    })

    // TODO: Add conditional to projects call so it only makes the request if mode is projects
    const {
        projects,
        // maxPage: projectsMaxPage,
        loading: projectsLoading,
        error: projectsError,
    } = useGetProjects(debouncedSearchTerm, debouncedSearchTerm.length > 0)

    const loading = mode === "users" ? usersLoading : projectsLoading
    const error = mode === "users" ? usersError : projectsError
    const items = mode === "users" ? users : projects

    // Set the max page for the pagination based on the results from the API call
    useEffect(() => {
        if (mode === "projects" && projects && projects.length > 0) {
            // TODO: Add projects max page
            // setMaxResultsPage(projectsMaxPage)
        } else if (mode === "users" && users && users.length > 0) {
            setMaxResultsPage(usersMaxPage)
        }
    }, [projects, users, mode, usersMaxPage])

    // Helper function to get user data for a project
    const getUserDataForProject = (projectSlug: string) => {
        return data?.find((user) => user.projectSlug === projectSlug)
    }

    // Sort items based on mode
    const sortedItems = [...(items || [])].sort((a, b) => {
        if (mode === "users") {
            // For users mode, sort by rank first
            const rankA = (a as UserData).rank || Number.MAX_SAFE_INTEGER
            const rankB = (b as UserData).rank || Number.MAX_SAFE_INTEGER
            if (rankA !== rankB) return rankA - rankB
        } else {
            // For projects mode, sort by score first
            const scoreA = getUserDataForProject((a as ProjectData).urlSlug)?.score
            const scoreB = getUserDataForProject((b as ProjectData).urlSlug)?.score
            if (scoreA !== scoreB) {
                // If either score is undefined/null, put it at the bottom
                if (!scoreA) return 1
                if (!scoreB) return -1
                return scoreB - scoreA // Higher scores first
            }
        }
        // If ranks/scores are equal, sort alphabetically by display name
        const nameA = a.displayName || ""
        const nameB = b.displayName || ""
        return nameA.localeCompare(nameB)
    })

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

    // Update URL when resultsPage changes
    useEffect(() => {
        const url = new URL(window.location.href)
        if (resultsPage > 1) {
            url.searchParams.set("page", resultsPage.toString())
        } else {
            url.searchParams.delete("page")
        }
        router.replace(url.pathname + url.search, { scroll: false })
    }, [resultsPage, router])

    // Set isSearching to false when loading completes
    useEffect(() => {
        if (!loading) {
            setIsSearching(false)
        }
    }, [loading])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setResultsPage(1)
        setSearchTerm(e.target.value)
        setIsSearching(true)
    }

    const handleClearSearch = () => {
        setResultsPage(1)
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

    const rankColumnWidth = mode === "users" ? { base: "20px", sm: "50px" } : { base: "0px", sm: "0px" }
    const displayNameColumnWidth = { base: "120px", sm: "auto" }
    const signalColumnWidth = { base: "40px", sm: "40px" }
    const scoreColumnWidth = { base: "40px", sm: "40px" }
    const peakSignalsColumnWidth = { base: "100px", sm: "100px" }

    return (
        <Box w={"100%"} px={{ base: 3, sm: 6 }}>
            <Table.Root>
                <Table.Header>
                    <Table.Row bg="transparent">
                        {mode === "users" && (
                            <TableHeader textAlign="center" maxW={rankColumnWidth}>
                                <HStack justifyContent="center">
                                    <Text display={{ base: "block", sm: "none" }}>#</Text>
                                    <Text display={{ base: "none", sm: "block" }}>Rank</Text>
                                </HStack>
                            </TableHeader>
                        )}
                        <TableHeader maxW={displayNameColumnWidth} px={{ base: 2, sm: 2 }}>
                            <SingleLineTextInput
                                value={searchTerm}
                                onChange={handleSearchChange}
                                handleClear={handleClearSearch}
                                placeholder={`Search...`}
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
                            display={{ base: "none", sm: project?.peakSignalsEnabled ? "table-cell" : "none" }}
                        >
                            Peak Signals
                        </TableHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {loading || isSearching ? (
                        <Table.Row bg="transparent">
                            <Table.Cell colSpan={5} py={0} h={"fit-content"} borderColor="transparent">
                                <VStack gap={2} h={"100%"} justifyContent="start" py={10}>
                                    <Spinner size="md" />
                                </VStack>
                            </Table.Cell>
                        </Table.Row>
                    ) : sortedItems.length === 0 ? (
                        <Table.Row bg="pageBackground">
                            <Table.Cell colSpan={5} textAlign="center" py={10} borderColor="contentBorder">
                                <Text color="textColorMuted">
                                    {searchTerm
                                        ? `No ${mode === "users" ? "users" : "results"} found with the name "${searchTerm}"`
                                        : `No ${mode === "users" ? "users" : "results"} found`}
                                </Text>
                            </Table.Cell>
                        </Table.Row>
                    ) : (
                        sortedItems.map((item, index) => {
                            const linkUrl =
                                mode === "users"
                                    ? `/p/${project?.urlSlug}/${(item as UserData).username}${window.location.search}`
                                    : `/p/${(item as ProjectData).urlSlug}/${(data as UserData[])?.[0]?.username}`

                            // Get user data for project if in projects mode
                            const userData =
                                mode === "projects" ? getUserDataForProject((item as ProjectData).urlSlug) : null

                            // Check if the user data is loading
                            const isScoreCalculating =
                                mode === "users"
                                    ? (item as UserData).signalStrengths?.some((strength) =>
                                          strength.data?.some((dataPoint) => dataPoint.lastChecked),
                                      ) || false
                                    : (userData as UserData)?.signalStrengths?.some((strength) =>
                                          strength.data?.some((dataPoint) => dataPoint.lastChecked),
                                      ) || false

                            const isScoreZero =
                                mode === "users" ? ((item as UserData).score ?? 0) === 0 : (userData?.score ?? 0) === 0

                            const isRowForLoggedInUser =
                                mode === "users" && (item as UserData).username === loggedInUser?.username

                            return (
                                <Table.Row
                                    key={index}
                                    cursor="pointer"
                                    bg={"pageBackground"}
                                    _hover={{
                                        bg: "contentBackground",
                                        _active: { bg: "button.secondary.active" },
                                    }}
                                    _active={{ bg: "button.secondary.active" }}
                                    transition="all 0.1s ease"
                                    borderBottom="1px solid"
                                    borderColor="contentBorder"
                                >
                                    {mode === "users" && (
                                        <Table.Cell
                                            borderBottom="none"
                                            py={"6px"}
                                            px={0}
                                            textAlign="center"
                                            minW={rankColumnWidth}
                                            maxW={rankColumnWidth}
                                            borderLeftRadius={"full"}
                                        >
                                            <Link href={linkUrl}>
                                                <Text
                                                    fontSize={{
                                                        base: (() => {
                                                            const rankText = isScoreZero
                                                                ? "-"
                                                                : (item as UserData).rank?.toString() || ""
                                                            if (rankText.length > 3) return "sm"
                                                            if (rankText.length > 2) return "md"
                                                            return "lg"
                                                        })(),
                                                        sm: "lg",
                                                    }}
                                                    fontWeight="bold"
                                                    color="textColor"
                                                >
                                                    {isScoreZero ? "-" : (item as UserData).rank}
                                                </Text>
                                            </Link>
                                        </Table.Cell>
                                    )}
                                    <Table.Cell borderBottom="none" py={"6px"} pr={0} maxW={displayNameColumnWidth}>
                                        <Link href={linkUrl}>
                                            <HStack
                                                gap={3}
                                                bg={isRowForLoggedInUser ? "gold.600" : "undefined"}
                                                borderRadius={"full"}
                                            >
                                                <Box
                                                    position="relative"
                                                    boxSize="40px"
                                                    minW="40px"
                                                    borderRadius="full"
                                                    overflow="hidden"
                                                >
                                                    <Image
                                                        src={
                                                            mode === "users"
                                                                ? !(item as UserData).profileImageUrl ||
                                                                  (item as UserData).profileImageUrl === ""
                                                                    ? ASSETS.DEFAULT_PROFILE_IMAGE
                                                                    : (item as UserData).profileImageUrl
                                                                : !(item as ProjectData).projectLogoUrl ||
                                                                    (item as ProjectData).projectLogoUrl === ""
                                                                  ? ASSETS.DEFAULT_PROFILE_IMAGE
                                                                  : (item as ProjectData).projectLogoUrl
                                                        }
                                                        alt={`${item.displayName} Image`}
                                                        fit="cover"
                                                    />
                                                </Box>
                                                <Text fontSize="lg" color="textColor" truncate>
                                                    {item.displayName}
                                                </Text>
                                            </HStack>
                                        </Link>
                                    </Table.Cell>
                                    {isScoreCalculating ? (
                                        <Table.Cell borderBottom="none" py={0} px={0} colSpan={3} maxW={"50px"}>
                                            <Link href={linkUrl} style={{ display: "flex", justifyContent: "center" }}>
                                                <HStack
                                                    gap={3}
                                                    py={1}
                                                    w={"100%"}
                                                    maxW={"150px"}
                                                    border={"3px solid"}
                                                    borderRadius={"10px"}
                                                    borderColor={"contentBorder"}
                                                    justifyContent={"center"}
                                                    className="rainbow-animation"
                                                >
                                                    <Text
                                                        fontWeight={"bold"}
                                                        color="white"
                                                        textAlign={"center"}
                                                        fontSize={"md"}
                                                    >
                                                        Updating...
                                                    </Text>
                                                </HStack>
                                            </Link>
                                        </Table.Cell>
                                    ) : (
                                        <>
                                            <Table.Cell borderBottom="none" py={0} px={0} maxW={signalColumnWidth}>
                                                <Link href={linkUrl}>
                                                    <HStack
                                                        justifyContent="center"
                                                        alignItems="center"
                                                        fontSize="xl"
                                                        fontWeight={isScoreZero ? "normal" : "bold"}
                                                    >
                                                        <Text
                                                            color={
                                                                mode === "users"
                                                                    ? (item as UserData).signal
                                                                        ? `scoreColor.${(item as UserData).signal}`
                                                                        : "textColorMuted"
                                                                    : userData?.signal
                                                                      ? `scoreColor.${userData.signal}`
                                                                      : "textColorMuted"
                                                            }
                                                        >
                                                            {(() => {
                                                                const signal =
                                                                    (isScoreZero
                                                                        ? "-"
                                                                        : mode === "users"
                                                                          ? (item as UserData).signal
                                                                          : userData?.signal) || ""
                                                                return signal
                                                                    ? signal.charAt(0).toUpperCase() + signal.slice(1)
                                                                    : "-"
                                                            })()}
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
                                                borderRightRadius={"full"}
                                            >
                                                <Link href={linkUrl}>
                                                    <HStack justifyContent="center" alignItems="center">
                                                        <Text
                                                            px={2}
                                                            py={1}
                                                            border="3px solid"
                                                            borderRadius="15px"
                                                            borderColor={
                                                                isScoreZero
                                                                    ? "transparent"
                                                                    : mode === "users"
                                                                      ? (item as UserData).signal
                                                                          ? `scoreColor.${(item as UserData).signal}`
                                                                          : "transparent"
                                                                      : userData?.signal
                                                                        ? `scoreColor.${userData.signal}`
                                                                        : "transparent"
                                                            }
                                                            color={
                                                                isScoreZero
                                                                    ? "textColorMuted"
                                                                    : mode === "users"
                                                                      ? (item as UserData).signal
                                                                          ? "textColor"
                                                                          : "textColorMuted"
                                                                      : userData?.signal
                                                                        ? "textColor"
                                                                        : "textColorMuted"
                                                            }
                                                            w="fit-content"
                                                            fontSize="lg"
                                                        >
                                                            {isScoreZero
                                                                ? "-"
                                                                : mode === "users"
                                                                  ? (item as UserData).score
                                                                  : userData?.score || "0"}
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
                                                    sm: project?.peakSignalsEnabled ? "table-cell" : "none",
                                                }}
                                            >
                                                <Link href={linkUrl}>
                                                    <HStack justify="center" gap={2}>
                                                        {[
                                                            ...(mode === "users"
                                                                ? (item as UserData).peakSignals || []
                                                                : userData?.peakSignals || []),
                                                        ]
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
                                        </>
                                    )}
                                </Table.Row>
                            )
                        })
                    )}
                </Table.Body>
            </Table.Root>
            {!isSearching && !loading && (
                <LeaderboardPagination page={resultsPage} maxPage={maxResultsPage} onPageChange={setResultsPage} />
            )}
        </Box>
    )
}
