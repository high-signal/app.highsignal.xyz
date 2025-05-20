import { HStack, Text, VStack, Box, Textarea, Button } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowRight, faChevronRight, faRefresh } from "@fortawesome/free-solid-svg-icons"
import { useState, useEffect } from "react"
import { useGetUsers } from "../../hooks/useGetUsers"
import UserPicker from "../ui/UserPicker"
import SingleLineTextInput from "../ui/SingleLineTextInput"

import SignalStrength from "../signal-display/signal-strength/SignalStrength"
import { getAccessToken } from "@privy-io/react-auth"
import ProjectPicker from "../ui/ProjectPicker"

export default function SignalStrengthSettings({ signalStrength }: { signalStrength: SignalStrengthData }) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedUsername, setSelectedUsername] = useState<string>("")
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
    const [newUserSelectedTrigger, setNewUserSelectedTrigger] = useState(false)
    const [currentForumUsername, setCurrentForumUsername] = useState<string>("")
    const [newForumUsername, setNewForumUsername] = useState<string>("")

    // TEST TIMER ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
    const [testTimerStart, setTestTimerStart] = useState<number | null>(null)
    const [testTimerStop, setTestTimerStop] = useState<number | null>(null)
    const [testTimerDuration, setTestTimerDuration] = useState<number | null>(null)

    useEffect(() => {
        let intervalId: NodeJS.Timeout

        if (testTimerStart && !testTimerStop) {
            // Update timer every 100ms while test is running
            intervalId = setInterval(() => {
                const currentDuration = Date.now() - testTimerStart
                setTestTimerDuration(currentDuration)
            }, 100)
        } else if (testTimerStart && testTimerStop) {
            // Test is complete, set final duration
            setTestTimerDuration(testTimerStop - testTimerStart)
        }

        // Cleanup interval when component unmounts or test stops
        return () => {
            if (intervalId) {
                clearInterval(intervalId)
            }
        }
    }, [testTimerStart, testTimerStop])

    // Format duration to show seconds and tenths
    const formatDuration = (duration: number | null) => {
        if (duration === null) return "0.0s"
        return `${(duration / 1000).toFixed(1)}s`
    }
    // TEST TIMER ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑

    // When a test user is selected, fetch the user data with superadmin fields
    const {
        users: testUser,
        loading: testUserLoading,
        error: testUserError,
    } = useGetUsers("lido", selectedUsername, false, selectedUsername.length > 0, true)

    const [project, setProject] = useState<ProjectData | null>(null)

    const [newModel, setNewModel] = useState<string>("")
    const [newTemperature, setNewTemperature] = useState<string>("")
    const [newMaxChars, setNewMaxChars] = useState<string>("")
    const [newPrompt, setNewPrompt] = useState<string>("")
    const [testResult, setTestResult] = useState<SignalStrengthUserData | null>(null)
    const [testResultsLoading, setTestResultsLoading] = useState(false)

    useEffect(() => {
        if (selectedUsername && testUser.length > 0 && testUser[0].username === selectedUsername) {
            setSelectedUser(testUser[0])
        }
    }, [selectedUsername, testUser, newUserSelectedTrigger])

    // When a user is selected, set the current forum username
    useEffect(() => {
        if (selectedUser) {
            setCurrentForumUsername(
                selectedUser?.connectedAccounts
                    ?.find((accountType) => accountType.name === "forumUsers")
                    ?.data?.find((forumUser) => Number(forumUser.projectId) === Number(project?.id))?.forumUsername ||
                    "",
            )
        }
    }, [selectedUser])

    function resetTest() {
        setTestResult(null)
        setSelectedUser(null)
        setSelectedUsername("")
        setProject(null)
        setNewModel("")
        setNewTemperature("")
        setNewMaxChars("")
        setNewPrompt("")
        setTestResultsLoading(false)
        setTestTimerStart(null)
        setTestTimerStop(null)
        setTestTimerDuration(null)
        setNewForumUsername("")
    }

    // When isOpen is false, set the test result to null
    useEffect(() => {
        if (!isOpen) {
            resetTest()
        }
    }, [isOpen])

    const ExtraData = ({ title, data }: { title: string; data: SignalStrengthUserData | undefined }) => (
        <VStack w={"100%"} maxW={"600px"} gap={1} px={5}>
            <Box w={"100%"} px={3}>
                <Text w={"100%"} py={2} textAlign={"center"} fontWeight={"bold"}>
                    {title}
                </Text>
            </Box>
            <VStack w={"100%"} gap={5}>
                <VStack w={"100%"} gap={1}>
                    <Text fontWeight={"bold"} w={"100%"}>
                        Explained Reason:
                    </Text>
                    <Text>{data?.explainedReasoning}</Text>
                </VStack>

                <Text as="pre" whiteSpace="pre-wrap" fontFamily="monospace" fontSize="sm">
                    {data?.logs}
                    <br />
                    Prompt tokens: {data?.promptTokens}
                    <br />
                    Completion tokens: {data?.completionTokens}
                </Text>
            </VStack>
        </VStack>
    )

    const fetchTestResult = async () => {
        setTestTimerStart(Date.now())
        setTestTimerStop(null)

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
                    testingModel: newModel,
                    testingTemperature: newTemperature ? Number(newTemperature) : undefined,
                    testingMaxChars: newMaxChars ? Number(newMaxChars) : undefined,
                    testingForumUsername: newForumUsername,
                }),
            },
        )

        // If response is 200, start a polling loop to check if the test is complete
        if (testingResponse.ok) {
            const pollTestResult = async () => {
                const testResultResponse = await fetch(
                    `/api/superadmin/users/?project=${project?.urlSlug}&user=${selectedUser?.username}&showTestDataOnly=true`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    },
                )

                const testResult = await testResultResponse.json()

                if (testResult[0].signalStrengths?.find((s: SignalStrengthData) => s.name === signalStrength.name)) {
                    setTestResult(testResult[0].signalStrengths?.find((s: any) => s.name === signalStrength.name))
                    setTestResultsLoading(false)
                    setTestTimerStop(Date.now())
                } else {
                    // If no result yet, poll again after 1 second
                    setTimeout(pollTestResult, 1000)
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
                py={4}
                px={{ base: 2, sm: 4 }}
                borderRadius={{ base: 0, sm: "16px" }}
                borderBottomRadius={{ base: 0, sm: isOpen ? "0px" : "16px" }}
                flexWrap={"wrap"}
            >
                <Button
                    secondaryButton
                    py={2}
                    pl={2}
                    pr={4}
                    borderRadius={"8px"}
                    gap={3}
                    onClick={() => signalStrength.status !== "dev" && setIsOpen(!isOpen)}
                    disabled={signalStrength.status === "dev"}
                >
                    <VStack transition="transform 0.2s" transform={`rotate(${isOpen ? 90 : 0}deg)`}>
                        <FontAwesomeIcon icon={faChevronRight} size="lg" />
                    </VStack>
                    <Text
                        w="fit-content"
                        fontWeight="bold"
                        fontSize="lg"
                        whiteSpace="nowrap"
                        color={signalStrength.status === "dev" ? "textColorMuted" : undefined}
                    >
                        {signalStrength.displayName}
                    </Text>
                </Button>
                <HStack
                    justifyContent="center"
                    bg={
                        signalStrength.status === "active" ? "lozenge.background.active" : "lozenge.background.disabled"
                    }
                    border={"2px solid"}
                    color={signalStrength.status === "active" ? "lozenge.text.active" : "lozenge.text.disabled"}
                    borderColor={
                        signalStrength.status === "active" ? "lozenge.border.active" : "lozenge.border.disabled"
                    }
                    borderRadius={"full"}
                    px={3}
                    py={1}
                    fontWeight={"semibold"}
                    cursor={"default"}
                >
                    <Text whiteSpace="nowrap">
                        {signalStrength.status.charAt(0).toUpperCase() + signalStrength.status.slice(1)}
                    </Text>
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
                        px={7}
                        py={2}
                        flexWrap={"wrap"}
                        gap={3}
                    >
                        <Text w={"100px"}>Project</Text>
                        <ProjectPicker
                            onProjectSelect={(project) => {
                                setProject(project)
                            }}
                            onClear={() => {
                                setProject(null)
                                setSelectedUsername("")
                                setSelectedUser(null)
                                setTestResult(null)
                            }}
                            isSuperAdminRequesting={true}
                        />
                    </HStack>
                    <HStack
                        w={"500px"}
                        maxW={"100%"}
                        bg={"contentBackground"}
                        alignItems={"center"}
                        px={7}
                        py={2}
                        flexWrap={"wrap"}
                        gap={3}
                    >
                        <Text w={"100px"}>User</Text>
                        <UserPicker
                            onUserSelect={(user) => {
                                setNewUserSelectedTrigger(!newUserSelectedTrigger)
                                setSelectedUsername(user.username || "")
                                setSelectedUser(null)
                                setTestResult(null)
                            }}
                            onClear={() => {
                                setSelectedUsername("")
                                setSelectedUser(null)
                                setTestResult(null)
                            }}
                            signalStrengthName={signalStrength.name}
                            disabled={!project}
                            isSuperAdminRequesting={true}
                        />
                    </HStack>
                    <HStack
                        w={"500px"}
                        maxW={"100%"}
                        bg={"contentBackground"}
                        alignItems={"center"}
                        px={7}
                        py={2}
                        flexWrap={"wrap"}
                        gap={3}
                        minH={"40px"}
                    >
                        {selectedUser && (
                            <>
                                <Text>Forum Username</Text>
                                <Text fontWeight={"bold"} color={currentForumUsername ? "inherit" : "textColorMuted"}>
                                    {currentForumUsername || "No forum username set"}
                                </Text>
                            </>
                        )}
                    </HStack>
                    <HStack
                        w={"500px"}
                        maxW={"100%"}
                        bg={"contentBackground"}
                        alignItems={"center"}
                        px={7}
                        py={2}
                        flexWrap={"wrap"}
                        gap={3}
                        minH={"44px"}
                    >
                        {selectedUser && (
                            <>
                                <Text>Manually Trigger User Analysis</Text>
                                <Button
                                    primaryButton
                                    px={2}
                                    py={1}
                                    borderRadius={"full"}
                                    onClick={async () => {
                                        const token = await getAccessToken()
                                        const response = await fetch(`/api/superadmin/accounts/trigger-update`, {
                                            method: "PATCH",
                                            headers: {
                                                "Content-Type": "application/json",
                                                Authorization: `Bearer ${token}`,
                                            },
                                            body: JSON.stringify({
                                                signalStrengthName: signalStrength.name,
                                                userId: selectedUser.id,
                                                projectId: project?.id,
                                                forumUsername: currentForumUsername,
                                            }),
                                        })

                                        if (!response.ok) {
                                            const errorData = await response.json()
                                            console.error(errorData.error)
                                        }
                                    }}
                                >
                                    (Eridian ONLY - for testing)
                                </Button>
                            </>
                        )}
                    </HStack>
                    {/* Prompt Options */}
                    <HStack
                        w={"100%"}
                        maxW={"100%"}
                        bg={"contentBackground"}
                        justifyContent={"center"}
                        alignItems={"start"}
                        gap={5}
                        px={5}
                        pt={5}
                        borderTopRadius={{ base: "0px", sm: "16px" }}
                        flexWrap={{ base: "wrap", sm: "nowrap" }}
                    >
                        <HStack w={"100%"} justifyContent={"center"}>
                            <VStack w={"fit-content"} alignItems={"start"} gap={2}>
                                <Text fontWeight={"bold"} textAlign={"center"} w={"100%"}>
                                    Current Settings
                                </Text>
                                <HStack
                                    w={"fit-content"}
                                    h={"35px"}
                                    bg={"pageBackground"}
                                    justifyContent={"center"}
                                    gap={0}
                                    py={1}
                                    px={3}
                                    borderRadius={"full"}
                                >
                                    <Text w={"120px"}>Model</Text>
                                    <Text whiteSpace="nowrap" overflow={"scroll"} maxW={{ base: "200px", sm: "100%" }}>
                                        {signalStrength.model}
                                    </Text>
                                </HStack>
                                <HStack
                                    w={"fit-content"}
                                    h={"35px"}
                                    bg={"pageBackground"}
                                    justifyContent={"center"}
                                    gap={0}
                                    py={1}
                                    px={3}
                                    borderRadius={"full"}
                                >
                                    <Text w={"120px"}>Temperature</Text>
                                    <Text>{signalStrength.temperature}</Text>
                                </HStack>
                                <HStack
                                    w={"fit-content"}
                                    h={"35px"}
                                    bg={"pageBackground"}
                                    justifyContent={"center"}
                                    gap={0}
                                    py={1}
                                    px={3}
                                    borderRadius={"full"}
                                >
                                    <Text w={"120px"}>Max Chars</Text>
                                    <Text>{signalStrength.maxChars}</Text>
                                </HStack>
                            </VStack>
                        </HStack>
                        <VStack w={"100%"} alignItems={"center"} gap={2}>
                            <Text fontWeight={"bold"}>New Settings</Text>
                            <SingleLineTextInput
                                maxW={"300px"}
                                value={newModel}
                                onChange={(e) => {
                                    setNewModel(e.target.value)
                                    setTestResult(null)
                                }}
                                placeholder="New model... (optional)"
                                handleClear={() => {
                                    setNewModel("")
                                    setTestResult(null)
                                }}
                                bg="pageBackground"
                            />
                            <SingleLineTextInput
                                maxW={"300px"}
                                value={newTemperature}
                                onChange={(e) => {
                                    setNewTemperature(e.target.value)
                                    setTestResult(null)
                                }}
                                placeholder="New temperature... (optional)"
                                handleClear={() => {
                                    setNewTemperature("")
                                    setTestResult(null)
                                }}
                                bg="pageBackground"
                            />
                            <SingleLineTextInput
                                maxW={"300px"}
                                value={newMaxChars}
                                onChange={(e) => {
                                    setNewMaxChars(e.target.value)
                                    setTestResult(null)
                                }}
                                placeholder="New max chars... (optional)"
                                handleClear={() => {
                                    setNewMaxChars("")
                                    setTestResult(null)
                                }}
                                bg="pageBackground"
                            />
                            <SingleLineTextInput
                                maxW={"300px"}
                                value={newForumUsername}
                                onChange={(e) => {
                                    setNewForumUsername(e.target.value)
                                    setTestResult(null)
                                }}
                                placeholder="New forum username... (optional)"
                                handleClear={() => {
                                    setNewForumUsername("")
                                    setTestResult(null)
                                }}
                                bg="pageBackground"
                            />
                        </VStack>
                    </HStack>
                    {/* Prompt Text Areas */}
                    <HStack
                        w={"100%"}
                        maxW={"100%"}
                        bg={"contentBackground"}
                        alignItems={"start"}
                        justifyContent={"center"}
                        px={5}
                        py={5}
                        flexWrap={{ base: "wrap", sm: "nowrap" }}
                    >
                        <VStack w={"100%"}>
                            <Text fontWeight={"bold"}>Current Prompt (ID: {signalStrength.promptId})</Text>
                            <Textarea
                                minH={"30dvh"}
                                fontFamily={"monospace"}
                                placeholder="No prompt set"
                                border={"none"}
                                borderRadius={"10px"}
                                disabled
                                value={signalStrength.prompt || ""}
                                bg="pageBackground"
                            />
                        </VStack>
                        <Button
                            secondaryButton
                            position={{ base: "relative", sm: "absolute" }}
                            left={{ base: "auto", sm: "50%" }}
                            transform={{ base: "none", sm: "translateX(-50%)" }}
                            transition="none"
                            borderRadius={"full"}
                            px={2}
                            py={0}
                            h={"25px"}
                            onClick={() => {
                                setNewPrompt(signalStrength.prompt || "")
                                setTestResult(null)
                            }}
                        >
                            <HStack gap={1}>
                                <Box transform={{ base: "rotate(90deg)", sm: "none" }}>
                                    <FontAwesomeIcon icon={faArrowRight} />
                                </Box>
                                <Text>Copy prompt</Text>
                                <Box transform={{ base: "rotate(90deg)", sm: "none" }}>
                                    <FontAwesomeIcon icon={faArrowRight} />
                                </Box>
                            </HStack>
                        </Button>
                        <VStack w={"100%"}>
                            <Text fontWeight={"bold"}>New Prompt (optional)</Text>
                            <Textarea
                                minH={"30dvh"}
                                fontFamily={"monospace"}
                                border={"3px solid"}
                                borderColor="transparent"
                                _focus={{
                                    borderColor: "input.border",
                                    boxShadow: "none",
                                    outline: "none",
                                }}
                                borderRadius={"10px"}
                                bg="pageBackground"
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
                        borderBottomRadius={{ base: 0, sm: "16px" }}
                        alignItems={"center"}
                        gap={2}
                    >
                        <HStack
                            w={"100%"}
                            justifyContent={"space-around"}
                            alignItems={"start"}
                            flexWrap={"wrap"}
                            pb={5}
                        >
                            <VStack w={"100%"} maxW={"600px"} gap={0}>
                                <Box w={"100%"} px={3}>
                                    <Text w={"100%"} py={2} textAlign={"center"} fontWeight={"bold"}>
                                        Current Analysis{" "}
                                        {project &&
                                            selectedUser &&
                                            "(ID: " +
                                                selectedUser.signalStrengths?.find(
                                                    (s) => s.name === signalStrength.name,
                                                )?.promptId +
                                                ")"}
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
                                {selectedUser && (
                                    <ExtraData
                                        title="Current Analysis Logs"
                                        data={selectedUser.signalStrengths?.find((s) => s.name === signalStrength.name)}
                                    />
                                )}
                            </VStack>
                            <VStack w={"100%"} maxW={"600px"} gap={0}>
                                <HStack
                                    w={"100%"}
                                    px={3}
                                    position="relative"
                                    flexWrap={"wrap"}
                                    justifyContent={"center"}
                                >
                                    <Text w={"100%"} py={2} textAlign={"center"} fontWeight={"bold"}>
                                        Test Results {testTimerStop ? `(${formatDuration(testTimerDuration)})` : ""}
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
                                            position={{ base: "relative", sm: "absolute" }}
                                            right={{ base: "auto", sm: 10 }}
                                        >
                                            <FontAwesomeIcon icon={faRefresh} size="xl" />
                                            Re-run test
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
                                            disabled={testResultsLoading}
                                            fontFamily={testResultsLoading ? "monospace" : undefined}
                                        >
                                            {testResultsLoading
                                                ? formatDuration(testTimerDuration)
                                                : "Run test analysis using new prompt"}
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
                                {testResult && <ExtraData title="Test Result Logs" data={testResult} />}
                            </VStack>
                        </HStack>
                    </VStack>
                </VStack>
            )}
        </VStack>
    )
}
