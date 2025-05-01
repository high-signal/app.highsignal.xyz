import { HStack, Text, Switch, VStack, Box, Textarea, Button, Image, Spinner } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowDown, faArrowRight, faChevronRight } from "@fortawesome/free-solid-svg-icons"
import { useState, useRef, useEffect } from "react"
import SingleLineTextInput from "../ui/SingleLineTextInput"
import { useGetUsers } from "../../hooks/useGetUsers"

import SignalStrength from "../signal-display/signal-strength/SignalStrength"
import { ASSETS } from "../../config/constants"

export default function SignalStrengthSettings({ signalStrength }: { signalStrength: SignalStrengthProjectData }) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedUsername, setSelectedUsername] = useState<string>("")
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("")
    const [isFocused, setIsFocused] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
    const inputRef = useRef<HTMLInputElement>(null!)
    const { users, loading, error } = useGetUsers("lido", debouncedSearchTerm, true)
    const {
        users: testUser,
        loading: testUserLoading,
        error: testUserError,
    } = useGetUsers("lido", selectedUsername, false)

    const [newPrompt, setNewPrompt] = useState<string>("")

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 200)
        return () => clearTimeout(timer)
    }, [searchTerm])

    useEffect(() => {
        if (selectedUsername && testUser[0].username === selectedUsername) {
            setSelectedUser(testUser[0])
        }
    }, [selectedUsername, testUser])

    const handleTestClick = () => {
        if (selectedUsername) {
            setSelectedUser(testUser[0])
        }
    }

    return (
        <VStack w="100%" gap={0}>
            <HStack
                justify="space-between"
                w="500px"
                maxW={"100%"}
                bg={"contentBackground"}
                p={4}
                borderRadius={"16px"}
                borderBottomRadius={isOpen ? "0px" : "16px"}
                flexWrap={"wrap"}
            >
                <HStack w={"250px"}>
                    <HStack
                        cursor={signalStrength.status !== "dev" ? "pointer" : "disabled"}
                        onClick={() => signalStrength.status !== "dev" && setIsOpen(!isOpen)}
                        _hover={signalStrength.status !== "dev" ? { bg: "gray.800" } : undefined}
                        py={2}
                        px={3}
                        borderRadius={"8px"}
                        gap={3}
                    >
                        <Box transition="transform 0.2s" transform={`rotate(${isOpen ? 90 : 0}deg)`}>
                            <FontAwesomeIcon icon={faChevronRight} />
                        </Box>
                        <Text
                            w="fit-content"
                            fontWeight="bold"
                            fontSize="lg"
                            whiteSpace="nowrap"
                            color={signalStrength.status === "dev" ? "textColor" : undefined}
                        >
                            {signalStrength.displayName}
                        </Text>
                    </HStack>
                </HStack>
                {signalStrength.status !== "dev" && signalStrength.enabled ? (
                    <HStack justifyContent="start" w="100px">
                        <SingleLineTextInput
                            value={signalStrength.maxValue.toString()}
                            onChange={() => {}}
                            onKeyDown={() => {}}
                            isEditable={true}
                        />
                        <Text whiteSpace="nowrap">/ 100</Text>
                    </HStack>
                ) : (
                    <Text>Coming soon 🏗️</Text>
                )}
                <Switch.Root
                    defaultChecked={signalStrength.status === "active" && signalStrength.enabled}
                    disabled={signalStrength.status != "active"}
                >
                    <Switch.HiddenInput />
                    <Switch.Control>
                        <Switch.Thumb />
                    </Switch.Control>
                    <Switch.Label />
                </Switch.Root>
            </HStack>
            {isOpen && (
                <VStack w="100%" pb={2} gap={0}>
                    {/* Testing Options */}
                    <HStack
                        w={"500px"}
                        maxW={"100%"}
                        bg={"contentBackground"}
                        alignItems={"center"}
                        px={3}
                        py={5}
                        flexWrap={"wrap"}
                        gap={{ base: 3, md: 5 }}
                    >
                        <Box position="relative" minW={{ base: "100%", md: "250px" }} flexGrow={1}>
                            <SingleLineTextInput
                                ref={inputRef}
                                placeholder="Select test user..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setSelectedUser(null)
                                }}
                                handleClear={() => {
                                    setSearchTerm("")
                                    setSelectedUsername("")
                                    setSelectedUser(null)
                                }}
                                onFocus={() => setIsFocused(true)}
                                // Add a small delay so the button is clicked before the input is blurred
                                onBlur={() => {
                                    setTimeout(() => {
                                        setIsFocused(false)
                                    }, 50)
                                }}
                            />
                            {isFocused && (
                                <Box
                                    position="absolute"
                                    top="100%"
                                    left={0}
                                    right={0}
                                    mt={1}
                                    bg="contentBackground"
                                    borderWidth={1}
                                    borderRadius="10px"
                                    boxShadow="md"
                                    zIndex={1}
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
                                    ) : users.length === 0 ? (
                                        <Text p={2}>No users found</Text>
                                    ) : (
                                        users.map((user) => (
                                            <Box
                                                key={user.username}
                                                p={2}
                                                cursor="pointer"
                                                _hover={{ bg: "gray.700" }}
                                                onMouseDown={(e) => {
                                                    e.preventDefault()
                                                    setSelectedUsername(user.username || "")
                                                    setSearchTerm(user.username || "")
                                                    setIsFocused(false)
                                                    inputRef.current?.blur()
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
                                                    {(() => {
                                                        const ss = user.signalStrengths?.find(
                                                            (s) => s.name === signalStrength.name,
                                                        )
                                                        const value = ss?.value

                                                        let display
                                                        let color
                                                        let bg
                                                        let fontSize
                                                        if (value === null || value === undefined) {
                                                            display = "Not connected"
                                                            color = "gray.400"
                                                            bg = "pageBackground"
                                                            fontSize = "xs"
                                                        } else if (Number(value) == 0) {
                                                            display = value
                                                            color = "gray.400"
                                                            bg = "pageBackground"
                                                        } else {
                                                            display = value
                                                            color = "#029E03"
                                                            bg = "green.500"
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
                                                    })()}
                                                </HStack>
                                            </Box>
                                        ))
                                    )}
                                </Box>
                            )}
                        </Box>
                        <HStack>
                            <Button onClick={handleTestClick}>
                                <Text>Test</Text>
                            </Button>
                            <Text>{"->"}</Text>
                            <Button>
                                <Text>Save</Text>
                            </Button>
                        </HStack>
                    </HStack>
                    {/* Prompt Options */}
                    <HStack
                        w={"100%"}
                        maxW={"100%"}
                        bg={"contentBackground"}
                        justifyContent={"center"}
                        alignItems={"start"}
                        gap={5}
                        px={3}
                        pt={3}
                        borderTopRadius={{ base: "0px", md: "16px" }}
                        flexWrap={"wrap"}
                    >
                        <VStack w={"100%"} maxW={"500px"} alignItems={"center"}>
                            <Text px={2}>CurrentPrompt</Text>
                            <Textarea
                                placeholder="No prompt set"
                                borderRadius={"10px"}
                                borderWidth={2}
                                disabled
                                value={signalStrength.prompt}
                            />
                        </VStack>
                        <Button
                            borderRadius={"full"}
                            px={2}
                            py={1}
                            mt={{ base: 0, sm: "35px" }}
                            onClick={() => {
                                setNewPrompt(signalStrength.prompt)
                            }}
                        >
                            <HStack gap={1}>
                                <Box display={{ base: "none", md: "block" }}>
                                    <FontAwesomeIcon icon={faArrowRight} />
                                </Box>
                                <Box display={{ base: "block", md: "none" }}>
                                    <FontAwesomeIcon icon={faArrowDown} />
                                </Box>
                                <Text>Copy</Text>
                                <Box display={{ base: "none", md: "block" }}>
                                    <FontAwesomeIcon icon={faArrowRight} />
                                </Box>
                                <Box display={{ base: "block", md: "none" }}>
                                    <FontAwesomeIcon icon={faArrowDown} />
                                </Box>
                            </HStack>
                        </Button>
                        <VStack w={"100%"} maxW={"500px"} alignItems={"center"}>
                            <Text px={2}>New Prompt</Text>
                            <Textarea
                                borderRadius={"10px"}
                                borderWidth={2}
                                value={newPrompt}
                                onChange={(e) => setNewPrompt(e.target.value)}
                            />
                        </VStack>
                    </HStack>
                    {/* Testing Output  */}
                    <VStack
                        w={"100%"}
                        bg={"contentBackground"}
                        borderBottomRadius={"16px"}
                        alignItems={"center"}
                        gap={2}
                        pt={5}
                    >
                        <HStack w={"100%"} justifyContent={"space-around"} alignItems={"start"} flexWrap={"wrap"}>
                            <VStack w={"100%"} maxW={"600px"} gap={2} borderRadius={"16px"}>
                                <Box w={"100%"} px={3}>
                                    <Text
                                        w={"100%"}
                                        py={2}
                                        textAlign={"center"}
                                        bg={"gray.800"}
                                        borderRadius={"full"}
                                        fontWeight={"bold"}
                                    >
                                        Current Result
                                    </Text>
                                </Box>
                                {selectedUser ? (
                                    <SignalStrength
                                        username={selectedUser.username || ""}
                                        userData={
                                            selectedUser.signalStrengths?.find(
                                                (s) => s.name === signalStrength.name,
                                            ) || {
                                                value: "0",
                                                description: "No data",
                                                improvements: "No data",
                                                name: signalStrength.name,
                                                summary: "No data",
                                            }
                                        }
                                        projectData={signalStrength}
                                        isUserConnected={true}
                                        refreshUserData={() => {}}
                                    />
                                ) : (
                                    <VStack w={"100%"} h={"200px"} justifyContent={"center"} alignItems={"center"}>
                                        <Text>No test user selected</Text>
                                        <Text>Please select a user to test</Text>
                                    </VStack>
                                )}
                            </VStack>
                            <VStack w={"100%"} maxW={"600px"} gap={2}>
                                <Box w={"100%"} px={3}>
                                    <Text
                                        w={"100%"}
                                        py={2}
                                        textAlign={"center"}
                                        bg={"blue.500"}
                                        borderRadius={"full"}
                                        fontWeight={"bold"}
                                    >
                                        Testing Result
                                    </Text>
                                </Box>
                                <SignalStrength
                                    username={"test"}
                                    userData={{
                                        value: "70",
                                        description: "new description",
                                        improvements: "new improvements",
                                        name: "test",
                                        summary: "new summary",
                                    }}
                                    projectData={{
                                        maxValue: 100,
                                        name: "test",
                                        displayName: `${signalStrength.displayName}`,
                                        status: "active",
                                        enabled: true,
                                        previousDays: 10,
                                    }}
                                    isUserConnected={true}
                                    refreshUserData={() => {}}
                                />
                            </VStack>
                        </HStack>
                    </VStack>
                </VStack>
            )}
        </VStack>
    )
}
