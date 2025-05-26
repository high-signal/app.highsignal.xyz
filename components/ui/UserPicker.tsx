import { HStack, Text, Box, Image, Spinner } from "@chakra-ui/react"
import { useState, useRef, useEffect } from "react"
import SingleLineTextInput from "./SingleLineTextInput"
import { useGetUsers } from "../../hooks/useGetUsers"
import { ASSETS } from "../../config/constants"

interface UserPickerProps {
    onUserSelect: (user: UserData) => void
    onClear?: () => void
    // signalStrengthName?: string
    disabled?: boolean
    isSuperAdminRequesting?: boolean
}

export default function UserPicker({
    onUserSelect,
    // signalStrengthName,
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
                placeholder="Select test user..."
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
                    borderWidth={2}
                    borderColor="contentBorder"
                    borderRadius="16px"
                    boxShadow="md"
                    zIndex={5}
                    maxH="200px"
                    overflowY="auto"
                >
                    {loading ? (
                        <HStack w={"100%"} h={"30px"} ml={2}>
                            <Spinner />
                        </HStack>
                    ) : error ? (
                        <Text p={2} color="red.500">
                            Error loading users
                        </Text>
                    ) : users.length === 0 && searchTerm.length >= 1 ? (
                        <Text p={2}>No users found</Text>
                    ) : (
                        users.map((user) => (
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
                                <HStack justifyContent={"space-between"} w={"100%"}>
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
                                        <Text>{user.username}</Text>
                                    </HStack>
                                    {/* TODO: Refactor this to use every signal strength + total score */}
                                    {/* {signalStrengthName &&
                                        (() => {
                                            const ss = user.signalStrengths?.find(
                                                (s) => s.signalStrengthName === signalStrengthName,
                                            )?.data?.[0]
                                            const value = ss?.value

                                            let display
                                            let color
                                            let bg
                                            let fontSize
                                            if (value === null || value === undefined) {
                                                display = "Not connected"
                                                color = "lozenge.text.disabled"
                                                bg = "pageBackground"
                                                fontSize = "xs"
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
                                                    px={2}
                                                    py={1}
                                                    borderRadius={"10px"}
                                                    fontSize={fontSize || undefined}
                                                >
                                                    {display}
                                                </Text>
                                            )
                                        })()} */}
                                </HStack>
                            </Box>
                        ))
                    )}
                </Box>
            )}
        </Box>
    )
}
