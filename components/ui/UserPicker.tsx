"use client"

import { HStack, Text, Box, Image, Spinner, Table } from "@chakra-ui/react"
import { useState, useRef, useEffect } from "react"
import SingleLineTextInput from "./SingleLineTextInput"
import { useGetUsers } from "../../hooks/useGetUsers"
import { useDebounce } from "../../hooks/useDebounce"
import { ASSETS } from "../../config/constants"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTriangleExclamation, faTableList, faLinkSlash, faChevronDown } from "@fortawesome/free-solid-svg-icons"
import { faDiscord, faXTwitter } from "@fortawesome/free-brands-svg-icons"

interface UserPickerProps {
    projectUrlSlug: string
    signalStrengths: SignalStrengthData[]
    selectorText?: string
    placeholder?: string
    onUserSelect: (user: UserData) => void
    onClear?: () => void
    disabled?: boolean
    isSuperAdminRequesting?: boolean
}

// Mapping of signal strength names to FontAwesome icons
const signalStrengthIcons: { [key: string]: any } = {
    discourse_forum: faTableList,
    discord: faDiscord,
    x_twitter: faXTwitter,
}

const usernameWidth = { base: "100px", sm: "100px" }
const signalStrengthWidth = { base: "30px", sm: "30px" }

const TableHeader = ({
    children,
    textAlign = "left",
    fontSize = "sm",
    maxW,
    px = { base: 0, sm: 2 },
}: {
    children: React.ReactNode
    textAlign?: "left" | "center"
    fontSize?: string
    maxW?: { base: string; sm: string }
    px?: { base: number; sm: number }
}) => (
    <Table.ColumnHeader
        color="textColorMuted"
        borderBottom="none"
        textAlign={textAlign}
        minW={maxW}
        maxW={maxW}
        w={maxW}
        px={px}
        pt={2}
        pb={0}
        fontSize={fontSize}
        whiteSpace="nowrap"
    >
        {children}
    </Table.ColumnHeader>
)

export default function UserPicker({
    projectUrlSlug,
    signalStrengths,
    selectorText,
    placeholder = "Search users...",
    onUserSelect,
    disabled = false,
    onClear,
    isSuperAdminRequesting = false,
}: UserPickerProps) {
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null!)

    // Use the proper debounce hook with a 300ms delay for better UX
    const debouncedSearchTerm = useDebounce(searchTerm, 300)

    const { users, loading, error } = useGetUsers({
        project: projectUrlSlug,
        username: debouncedSearchTerm,
        fuzzy: true,
        shouldFetch: isFocused,
        isSuperAdminRequesting: isSuperAdminRequesting,
    })

    useEffect(() => {
        if (disabled) {
            setIsFocused(false)
            setSearchTerm("")
        }
    }, [disabled])

    return (
        <Box position="relative" minW={{ base: "100%", sm: "max-content" }} flexGrow={1}>
            <SingleLineTextInput
                ref={inputRef}
                placeholder={placeholder}
                value={selectorText && !isFocused ? selectorText : searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value)
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                    if (selectorText) {
                        setSearchTerm("")
                    }
                    setTimeout(() => {
                        setIsFocused(false)
                    }, 50)
                }}
                {...(!selectorText && {
                    handleClear: () => {
                        setSearchTerm("")
                        if (onClear) {
                            onClear()
                        }
                    },
                })}
                isSelectorOnly={Boolean(selectorText)}
                bg={"pageBackground"}
                borderColor={"button.secondary.default"}
            />
            {selectorText && !isFocused && (
                <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" pointerEvents="none">
                    <FontAwesomeIcon icon={faChevronDown} />
                </Box>
            )}
            {disabled && (
                <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bg="pageBackground"
                    opacity={0.8}
                    borderRadius="full"
                    zIndex={1}
                    cursor="not-allowed"
                />
            )}
            {isFocused && !disabled && (
                <Box
                    position="absolute"
                    top="100%"
                    left={0}
                    right={0}
                    mt={1}
                    bg="pageBackground"
                    borderWidth={3}
                    borderColor="contentBorder"
                    borderRadius="16px"
                    boxShadow="md"
                    zIndex={5}
                    maxH="50dvh"
                    minH="40px"
                    overflowY="auto"
                >
                    {signalStrengths.length > 0 ? (
                        <Table.Root>
                            <Table.Header position="sticky" top={0} zIndex={1}>
                                <Table.Row bg="pageBackground">
                                    <TableHeader px={{ base: 0, sm: 0 }} maxW={usernameWidth}>
                                        <Box w={"100%"} borderBottom="2px solid" borderColor="contentBorder" pb={1}>
                                            <Text pl={3}>Username</Text>
                                        </Box>
                                    </TableHeader>
                                    {signalStrengths.map((signalStrength) => (
                                        <TableHeader
                                            key={signalStrength.name}
                                            textAlign={"center"}
                                            px={{ base: 0, sm: 0 }}
                                            maxW={signalStrengthWidth}
                                            fontSize={"lg"}
                                        >
                                            <Box w={"100%"} borderBottom="2px solid" borderColor="contentBorder" pb={1}>
                                                <FontAwesomeIcon
                                                    icon={
                                                        signalStrengthIcons[signalStrength.name] ||
                                                        faTriangleExclamation
                                                    }
                                                />
                                            </Box>
                                        </TableHeader>
                                    ))}
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {loading ? (
                                    <Table.Row bg="pageBackground">
                                        <Table.Cell>
                                            <HStack w={"100%"} ml={1}>
                                                <Spinner />
                                            </HStack>
                                        </Table.Cell>
                                    </Table.Row>
                                ) : error ? (
                                    <Table.Row bg="pageBackground">
                                        <Table.Cell>
                                            <Text ml={"2px"} color="orange.500">
                                                Error loading users
                                            </Text>
                                        </Table.Cell>
                                    </Table.Row>
                                ) : users && users.length === 0 ? (
                                    <Table.Row bg="pageBackground">
                                        <Table.Cell>
                                            <Text ml={"2px"}>No users found</Text>
                                        </Table.Cell>
                                    </Table.Row>
                                ) : (
                                    users &&
                                    users.map((user) => (
                                        <Table.Row
                                            key={user.username}
                                            bg="pageBackground"
                                            cursor="pointer"
                                            _hover={{ bg: "contentBackground" }}
                                            onMouseDown={(e) => {
                                                e.preventDefault()
                                                setSearchTerm(user.username || "")
                                                setIsFocused(false)
                                                inputRef.current?.blur()
                                                onUserSelect(user)
                                            }}
                                        >
                                            <Table.Cell minW={"100px"} maxW={"100px"} overflow={"hidden"} py={2}>
                                                <HStack>
                                                    <Image
                                                        src={
                                                            !user.profileImageUrl || user.profileImageUrl === ""
                                                                ? ASSETS.DEFAULT_PROFILE_IMAGE
                                                                : user.profileImageUrl
                                                        }
                                                        alt={`User ${user.displayName} Profile Image`}
                                                        fit="cover"
                                                        transition="transform 0.2s ease-in-out"
                                                        w="25px"
                                                        borderRadius="full"
                                                    />
                                                    <Text wordBreak="break-all" overflowWrap="break-word">
                                                        {user.username}
                                                    </Text>
                                                </HStack>
                                            </Table.Cell>
                                            {signalStrengths.map((signalStrength) => (
                                                <Table.Cell
                                                    key={signalStrength.name}
                                                    fontFamily={"monospace"}
                                                    maxW={signalStrengthWidth}
                                                    minW={signalStrengthWidth}
                                                    w={signalStrengthWidth}
                                                    px={0}
                                                    py={0}
                                                    textAlign={"center"}
                                                >
                                                    {(() => {
                                                        const ss = user.signalStrengths?.find(
                                                            (s) => s.signalStrengthName === signalStrength.name,
                                                        )?.data?.[0]
                                                        const value = ss?.value

                                                        let display
                                                        let color
                                                        let bg
                                                        let fontSize
                                                        if (value === null || value === undefined) {
                                                            return (
                                                                <Box color="textColorMuted">
                                                                    <FontAwesomeIcon icon={faLinkSlash} fontSize="xs" />
                                                                </Box>
                                                            )
                                                        } else if (Number(value) == 0) {
                                                            display = value
                                                            color = "lozenge.text.disabled"
                                                            bg = "lozenge.background.disabled"
                                                        } else {
                                                            display = value
                                                            color = "lozenge.text.active"
                                                            bg = "lozenge.background.active"
                                                        }

                                                        return (
                                                            <Text
                                                                bg={bg}
                                                                color={color}
                                                                px={1}
                                                                py={1}
                                                                mx={1}
                                                                borderRadius={"10px"}
                                                                fontSize={fontSize || undefined}
                                                            >
                                                                {display}
                                                            </Text>
                                                        )
                                                    })()}
                                                </Table.Cell>
                                            ))}
                                        </Table.Row>
                                    ))
                                )}
                            </Table.Body>
                        </Table.Root>
                    ) : loading ? (
                        <HStack w={"100%"} h={"30px"} ml={2} mt={1} mb={"7px"}>
                            <Spinner />
                        </HStack>
                    ) : error ? (
                        <Text p={2} color="red.500">
                            Error loading users
                        </Text>
                    ) : users && users.length === 0 && searchTerm.length >= 1 ? (
                        <Text p={2}>No users found</Text>
                    ) : (
                        users &&
                        users
                            .sort((a, b) => (a.username || "").localeCompare(b.username || ""))
                            .filter(
                                (user, index, self) => index === self.findIndex((u) => u.username === user.username),
                            )
                            .map((user) => (
                                <Box
                                    key={user.username}
                                    p={2}
                                    cursor="pointer"
                                    _hover={{ bg: "contentBackground" }}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        setSearchTerm(user.username || "")
                                        setIsFocused(false)
                                        inputRef.current?.blur()
                                        onUserSelect(user)
                                    }}
                                >
                                    <HStack>
                                        <Image
                                            src={
                                                !user.profileImageUrl || user.profileImageUrl === ""
                                                    ? ASSETS.DEFAULT_PROFILE_IMAGE
                                                    : user.profileImageUrl
                                            }
                                            alt={`User ${user.displayName} Profile Image`}
                                            fit="cover"
                                            transition="transform 0.2s ease-in-out"
                                            w="25px"
                                            borderRadius="full"
                                        />
                                        <Text>{user.displayName}</Text>
                                    </HStack>
                                </Box>
                            ))
                    )}
                </Box>
            )}
        </Box>
    )
}
