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
                p={4}
                borderRadius={"16px"}
                borderBottomRadius={isOpen ? "0px" : "16px"}
                flexWrap={"wrap"}
            >
                <HStack
                    cursor={signalStrength.status !== "dev" ? "pointer" : "disabled"}
                    onClick={() => signalStrength.status !== "dev" && setIsOpen(!isOpen)}
                    bg={signalStrength.status === "active" ? "gray.800" : undefined}
                    _hover={signalStrength.status !== "dev" ? { bg: "gray.700" } : undefined}
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
                <HStack
                    justifyContent="center"
                    bg={signalStrength.status === "active" ? "green.500" : "gray.700"}
                    border={"2px solid"}
                    borderColor={signalStrength.status === "active" ? "#029E03" : "gray.500"}
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
                        <Text w={"100px"}>Test Project</Text>
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
                        <Text w={"100px"}>Test User</Text>
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
                        />
                    </HStack>
                    {/* Prompt Options */}
                    <HStack
                        w={"100%"}
                        maxW={"100%"}
                        bg={"contentBackground"}
                        justifyContent={"center"}
                        alignItems={"end"}
                        gap={5}
                        px={5}
                        pt={5}
                        borderTopRadius={{ base: "0px", md: "16px" }}
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
                            <Text fontWeight={"bold"}>Current Prompt</Text>
                            <Textarea
                                minH={"30dvh"}
                                fontFamily={"monospace"}
                                placeholder="No prompt set"
                                borderRadius={"10px"}
                                borderWidth={2}
                                disabled
                                value={signalStrength.prompt || ""}
                            />
                        </VStack>
                        <Button
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
                                {testResult && <ExtraData title="Test Result Logs" data={testResult} />}
                            </VStack>
                        </HStack>
                    </VStack>
                </VStack>
            )}
        </VStack>
    )
}
