import { HStack, Text, VStack, Box, Textarea, Button } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowDown, faArrowRight, faChevronRight, faRefresh } from "@fortawesome/free-solid-svg-icons"
import { useState, useEffect } from "react"
import { useGetUsers } from "../../hooks/useGetUsers"
import UserPicker from "../ui/UserPicker"

import SignalStrength from "../signal-display/signal-strength/SignalStrength"
import { getAccessToken } from "@privy-io/react-auth"
import ProjectPicker from "../ui/ProjectPicker"

export default function SignalStrengthSettings({ signalStrength }: { signalStrength: SignalStrengthData }) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedUsername, setSelectedUsername] = useState<string>("")
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
    const [newUserSelectedTrigger, setNewUserSelectedTrigger] = useState(false)
    const {
        users: testUser,
        loading: testUserLoading,
        error: testUserError,
    } = useGetUsers("lido", selectedUsername, false, selectedUsername.length > 0)

    const [project, setProject] = useState<ProjectData | null>(null)

    const [newPrompt, setNewPrompt] = useState<string>("")
    const [testResult, setTestResult] = useState<SignalStrengthUserData | null>(null)
    const [testResultsLoading, setTestResultsLoading] = useState(false)

    useEffect(() => {
        if (selectedUsername && testUser.length > 0 && testUser[0].username === selectedUsername) {
            setSelectedUser(testUser[0])
        }
    }, [selectedUsername, testUser, newUserSelectedTrigger])

    const fetchTestResult = async () => {
        setTestResultsLoading(true)
        setTestResult(null)

        const token = await getAccessToken()
        const testingResponse = await fetch(
            `/api/settings/superadmin/signal-strengths/testing?project=${project?.urlSlug}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    targetUsername: selectedUser?.username,
                    signalStrengthName: signalStrength.name,
                    testingPrompt: newPrompt,
                }),
            },
        )

        // If response is 200, start a polling loop to check if the test is complete
        if (testingResponse.ok) {
            const pollTestResult = async () => {
                const testResultResponse = await fetch(
                    `/api/settings/superadmin/signal-strengths/testing?project=${project?.urlSlug}&signalStrengthName=${signalStrength.name}&targetUsername=${selectedUser?.username}`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    },
                )

                if (testResultResponse.status === 200) {
                    const testResult = await testResultResponse.json()
                    setTestResult(testResult.testResults)
                    setTestResultsLoading(false)
                } else if (testResultResponse.status === 202) {
                    // If no result yet, poll again after 1 second
                    setTimeout(pollTestResult, 1000)
                } else {
                    console.error("Error fetching test result:", testResultResponse.statusText)
                    setTestResultsLoading(false)
                }
            }

            // Start the polling loop
            // Add a small delay as the poll does not need to start immediately
            setTimeout(pollTestResult, 3000)
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
                <HStack justifyContent="start" w="100px">
                    <Text whiteSpace="nowrap">{signalStrength.status}</Text>
                </HStack>
            </HStack>
            {isOpen && (
                <VStack w="100%" pb={2} gap={0}>
                    {/* Testing Options */}
                    <HStack
                        w={"500px"}
                        maxW={"100%"}
                        bg={"contentBackground"}
                        alignItems={"center"}
                        px={5}
                        py={5}
                        flexWrap={"wrap"}
                        gap={3}
                    >
                        <Text>Test Project</Text>
                        <ProjectPicker
                            onProjectSelect={(project) => {
                                setProject(project)
                            }}
                        />
                    </HStack>
                    <HStack
                        w={"500px"}
                        maxW={"100%"}
                        bg={"contentBackground"}
                        alignItems={"center"}
                        px={5}
                        py={5}
                        flexWrap={"wrap"}
                        gap={3}
                    >
                        <Text>Test User</Text>
                        <UserPicker
                            onUserSelect={(user) => {
                                setNewUserSelectedTrigger(!newUserSelectedTrigger)
                                setSelectedUsername(user.username || "")
                                setSelectedUser(null)
                                setTestResult(null)
                            }}
                            signalStrengthName={signalStrength.name}
                        />
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
                        pt={5}
                        borderTopRadius={{ base: "0px", md: "16px" }}
                        flexWrap={"wrap"}
                    >
                        <VStack w={"100%"} maxW={"500px"} alignItems={"center"}>
                            <Text px={2} fontWeight={"bold"}>
                                Current Prompt
                            </Text>
                            <Textarea
                                minH={"120px"}
                                placeholder="No prompt set"
                                borderRadius={"10px"}
                                borderWidth={2}
                                disabled
                                value={signalStrength.prompt || ""}
                            />
                        </VStack>
                        <Button
                            borderRadius={"full"}
                            px={2}
                            py={0}
                            h={"30px"}
                            mt={{ base: 0, sm: "35px" }}
                            onClick={() => {
                                setNewPrompt(signalStrength.prompt || "")
                                setTestResult(null)
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
                            <Text px={2} fontWeight={"bold"}>
                                New Prompt
                            </Text>
                            <Textarea
                                minH={"120px"}
                                borderRadius={"10px"}
                                borderWidth={2}
                                value={newPrompt || ""}
                                onChange={(e) => {
                                    setNewPrompt(e.target.value)
                                    setTestResult(null)
                                }}
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
                            <VStack w={"100%"} maxW={"600px"} gap={0}>
                                <Box w={"100%"} px={3}>
                                    <Text w={"100%"} py={2} textAlign={"center"} fontWeight={"bold"}>
                                        Current Analysis
                                    </Text>
                                </Box>
                                {project && selectedUser ? (
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
                                        projectData={
                                            project.signalStrengths?.find((s) => s.name === signalStrength.name)!
                                        }
                                        isUserConnected={true}
                                        refreshUserData={() => {}}
                                    />
                                ) : (
                                    <VStack w={"100%"} h={"200px"} justifyContent={"center"} alignItems={"center"}>
                                        <Text>Select a test user to view their current analysis</Text>
                                    </VStack>
                                )}
                            </VStack>
                            <VStack w={"100%"} maxW={"600px"} gap={0}>
                                <HStack w={"100%"} px={3} position="relative">
                                    <Text w={"100%"} py={2} textAlign={"center"} fontWeight={"bold"}>
                                        Testing Result
                                    </Text>
                                    {testResult && selectedUser && (
                                        <Button
                                            py={0}
                                            px={2}
                                            size={"xs"}
                                            fontSize={"sm"}
                                            borderRadius={"full"}
                                            onClick={fetchTestResult}
                                            loading={testResultsLoading}
                                            position="absolute"
                                            right={10}
                                        >
                                            <FontAwesomeIcon icon={faRefresh} size="xl" />
                                            Refresh
                                        </Button>
                                    )}
                                </HStack>
                                {testResult ? (
                                    <SignalStrength
                                        username={selectedUser?.username || ""}
                                        userData={testResult}
                                        projectData={
                                            project?.signalStrengths?.find((s) => s.name === signalStrength.name)!
                                        }
                                        isUserConnected={true}
                                        refreshUserData={() => {}}
                                    />
                                ) : selectedUser ? (
                                    <VStack w={"100%"} h={"200px"} justifyContent={"center"} alignItems={"center"}>
                                        <Button
                                            className="rainbow-animation"
                                            color={"white"}
                                            fontWeight={"bold"}
                                            fontSize={"md"}
                                            borderRadius={"full"}
                                            onClick={fetchTestResult}
                                            loading={testResultsLoading}
                                        >
                                            Run test analysis using new prompt
                                        </Button>
                                    </VStack>
                                ) : selectedUser ? (
                                    <VStack w={"100%"} h={"200px"} justifyContent={"center"} alignItems={"center"}>
                                        <Text>No new prompt set</Text>
                                        <Text>Please set a new prompt</Text>
                                    </VStack>
                                ) : (
                                    <VStack w={"100%"} h={"200px"} justifyContent={"center"} alignItems={"center"}>
                                        <Text>Select a test user to test their new analysis</Text>
                                    </VStack>
                                )}
                            </VStack>
                        </HStack>
                    </VStack>
                </VStack>
            )}
        </VStack>
    )
}
