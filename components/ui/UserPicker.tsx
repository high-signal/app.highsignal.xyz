import { HStack, Text, Box, Image, Spinner, VStack, Table } from "@chakra-ui/react"
import { useState, useRef, useEffect } from "react"
import SingleLineTextInput from "./SingleLineTextInput"
import { useGetUsers } from "../../hooks/useGetUsers"
import { ASSETS } from "../../config/constants"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTriangleExclamation, faTableList, faLinkSlash } from "@fortawesome/free-solid-svg-icons"
import { faDiscord, faXTwitter } from "@fortawesome/free-brands-svg-icons"

interface UserPickerProps {
    signalStrengths: SignalStrengthData[]
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
    signalStrengths,
    onUserSelect,
    disabled = false,
    onClear,
    isSuperAdminRequesting = false,
}: UserPickerProps) {
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("")
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null!)
    const { users, loading, error } = useGetUsers("lido", debouncedSearchTerm, true, isFocused, isSuperAdminRequesting)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 200)
        return () => clearTimeout(timer)
    }, [searchTerm])

    useEffect(() => {
        if (disabled) {
            setIsFocused(false)
            setSearchTerm("")
            setDebouncedSearchTerm("")
        }
    }, [disabled])

    return (
        <Box position="relative" minW={{ base: "100%", sm: "250px" }} flexGrow={1}>
            <SingleLineTextInput
                ref={inputRef}
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value)
                }}
                handleClear={() => {
                    setSearchTerm("")
                    if (onClear) {
                        onClear()
                    }
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                    setTimeout(() => {
                        setIsFocused(false)
                    }, 50)
                }}
                bg="pageBackground"
            />
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
                    overflowY="auto"
                >
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
                                                icon={signalStrengthIcons[signalStrength.name] || faTriangleExclamation}
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
                            ) : users.length === 0 ? (
                                <Table.Row bg="pageBackground">
                                    <Table.Cell>
                                        <Text ml={"2px"}>No users found</Text>
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
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
                </Box>
            )}
        </Box>
    )
}
