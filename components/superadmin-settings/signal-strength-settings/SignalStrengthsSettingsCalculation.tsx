"use client"

import { HStack, Text, VStack, Box, Textarea, Button, Span } from "@chakra-ui/react"
import { useEffect, useState, useRef } from "react"
import { diff_match_patch } from "diff-match-patch"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowRight, faRefresh, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons"

import SignalStrength from "../../signal-display/signal-strength/SignalStrength"
import SingleLineTextInput from "../../ui/SingleLineTextInput"
import SignalStrengthViewerPicker from "../../ui/SignalStrengthViewerPicker"
import { usePromptComparison } from "../../../hooks/usePromptComparison"

export default function SignalStrengthsSettingsCalculation({
    type,
    signalStrength,
    project,
    selectedUser,
    fetchTestResult,
    testResult,
    testTimerStop,
    testTimerDuration,
    testResultsLoading,
    testError,
    testingInputData,
    setTestingInputData,
    resetTest,
}: {
    type: "raw" | "smart"
    signalStrength: SignalStrengthData
    project: ProjectData | null
    selectedUser: UserData | null
    fetchTestResult: () => void
    testResult: SignalStrengthUserData[] | null
    setTestTimerStart: (start: number) => void
    testTimerStop: number | null
    testTimerDuration: number | null
    testResultsLoading: boolean
    testError: string | null
    testingInputData: TestingInputData | null
    setTestingInputData: (testingInputData: TestingInputData) => void
    resetTest: () => void
}) {
    const [selectedSignalStrengthViewer, setSelectedSignalStrengthViewer] = useState<SignalStrengthUserData | null>(
        null,
    )

    const {
        isPromptExpanded,
        setIsPromptExpanded,
        currentPromptRef,
        newPromptRef,
        currentPromptTextAreaHeight,
        newPromptTextAreaHeight,
        diffs,
    } = usePromptComparison({
        currentPrompt: signalStrength.prompt,
        newPrompt: testingInputData?.testingPrompt,
    })

    // Set selected signal strength viewer data when user is selected or changes
    useEffect(() => {
        setSelectedSignalStrengthViewer(
            selectedUser?.signalStrengths?.find((s) => s.signalStrengthName === signalStrength.name)?.data?.[0] || null,
        )
    }, [selectedUser, signalStrength.name])

    // Format duration to show seconds and tenths
    const formatDuration = (duration: number | null) => {
        if (duration === null) return "0.0s"
        return `${(duration / 1000).toFixed(1)}s`
    }

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

    return (
        <VStack w="100%" gap={0} borderRadius={{ base: 0, sm: "16px" }} overflow={"hidden"}>
            {/* Prompt Options */}
            <HStack
                w={"100%"}
                maxW={"100%"}
                bg={"contentBackground"}
                justifyContent={"center"}
                alignItems={"start"}
                gap={{ base: 10, sm: 0 }}
                p={5}
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
                        value={testingInputData?.testingModel || ""}
                        onChange={(e) => {
                            setTestingInputData({
                                ...testingInputData,
                                testingModel: e.target.value,
                            })
                            resetTest()
                        }}
                        placeholder="New model... (optional)"
                        handleClear={() => {
                            setTestingInputData({
                                ...testingInputData,
                                testingModel: "",
                            })
                            resetTest()
                        }}
                        bg="pageBackground"
                    />
                    <SingleLineTextInput
                        maxW={"300px"}
                        value={testingInputData?.testingTemperature || ""}
                        onChange={(e) => {
                            setTestingInputData({
                                ...testingInputData,
                                testingTemperature: e.target.value,
                            })
                            resetTest()
                        }}
                        placeholder="New temperature... (optional)"
                        handleClear={() => {
                            setTestingInputData({
                                ...testingInputData,
                                testingTemperature: undefined,
                            })
                            resetTest()
                        }}
                        bg="pageBackground"
                    />
                    <SingleLineTextInput
                        maxW={"300px"}
                        value={testingInputData?.testingMaxChars || ""}
                        onChange={(e) => {
                            setTestingInputData({
                                ...testingInputData,
                                testingMaxChars: e.target.value,
                            })
                            resetTest()
                        }}
                        placeholder="New max chars... (optional)"
                        handleClear={() => {
                            setTestingInputData({
                                ...testingInputData,
                                testingMaxChars: undefined,
                            })
                            resetTest()
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
                <VStack w={"100%"} gap={0}>
                    <Text fontWeight={"bold"} mb={2}>
                        Current Prompt (ID: {signalStrength.promptId})
                    </Text>
                    <Box
                        ref={currentPromptRef}
                        minH={currentPromptTextAreaHeight}
                        maxH={currentPromptTextAreaHeight}
                        fontFamily={"monospace"}
                        border={"none"}
                        borderTopRadius="10px"
                        borderBottomRadius="0px"
                        bg="pageBackgroundMuted"
                        px={3}
                        py={2}
                        overflowY="auto"
                        whiteSpace="pre-wrap"
                        cursor={"default"}
                        fontSize={"sm"}
                        transition="0.2s ease-in-out"
                    >
                        {testingInputData?.testingPrompt && diffs.length > 0
                            ? diffs.map(([op, text], i) => {
                                  if (op === 0)
                                      return (
                                          <Span key={i} opacity={0.6}>
                                              {text}
                                          </Span>
                                      )
                                  if (op === -1)
                                      return (
                                          <Span key={i} bg={"red.500"} borderRadius={"4px"}>
                                              {text}
                                          </Span>
                                      )
                                  if (op === 1)
                                      return (
                                          <Span key={i} bg={"green.500"} borderRadius={"4px"}>
                                              {text}
                                          </Span>
                                      )
                                  return null
                              })
                            : signalStrength.prompt || "No prompt set"}
                    </Box>
                    <Button
                        w="100%"
                        secondaryButton
                        onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                        borderTopRadius="0px"
                        borderBottomRadius="10px"
                        py={2}
                    >
                        <HStack>
                            <FontAwesomeIcon icon={isPromptExpanded ? faChevronUp : faChevronDown} />
                            <Text>{isPromptExpanded ? "Collapse" : "Expand"} prompts</Text>
                        </HStack>
                    </Button>
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
                        setTestingInputData({
                            ...testingInputData,
                            testingPrompt: signalStrength.prompt || "",
                        })
                        resetTest()
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
                <VStack w={"100%"} gap={0}>
                    <Text fontWeight={"bold"} mb={2}>
                        New Prompt (optional)
                    </Text>
                    <Textarea
                        ref={newPromptRef}
                        minH={newPromptTextAreaHeight}
                        maxH={newPromptTextAreaHeight}
                        fontFamily={"monospace"}
                        border={"3px solid"}
                        borderColor="transparent"
                        _focus={{
                            borderColor: "input.border",
                            boxShadow: "none",
                            outline: "none",
                        }}
                        px={3}
                        py={2}
                        borderTopRadius="10px"
                        borderBottomRadius="0px"
                        bg="pageBackground"
                        value={testingInputData?.testingPrompt || ""}
                        onChange={(e) => {
                            setTestingInputData({
                                ...testingInputData,
                                testingPrompt: e.target.value,
                            })
                            resetTest()
                        }}
                        transition="0.2s ease-in-out"
                    />
                    <Button
                        w="100%"
                        secondaryButton
                        onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                        borderTopRadius="0px"
                        borderBottomRadius="10px"
                        py={2}
                    >
                        <HStack>
                            <FontAwesomeIcon icon={isPromptExpanded ? faChevronUp : faChevronDown} />
                            <Text>{isPromptExpanded ? "Collapse" : "Expand"} prompts</Text>
                        </HStack>
                    </Button>
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
                <HStack w={"100%"} justifyContent={"space-around"} alignItems={"start"} flexWrap={"wrap"} pb={5}>
                    <VStack w={"100%"} maxW={"600px"} gap={0}>
                        <HStack w={"100%"} px={3} justifyContent={"center"}>
                            {selectedUser ? (
                                <HStack flexWrap={"wrap"} gap={{ base: 0, sm: 2 }} justifyContent={"center"}>
                                    <Text py={2} textAlign={"center"} fontWeight={"bold"}>
                                        {type === "raw" ? "Raw" : "Smart"} Analysis for{" "}
                                    </Text>
                                    <SignalStrengthViewerPicker
                                        userSignalStrengths={
                                            selectedUser?.signalStrengths
                                                ?.find((s) => s.signalStrengthName === signalStrength.name)
                                                ?.data.filter((data) => {
                                                    // Filter out any with testRequestingUser
                                                    if (data.testRequestingUser) return false

                                                    // For raw type, only include those with rawValue
                                                    if (type === "raw") return data.rawValue !== undefined

                                                    // For smart type, only include those with value
                                                    if (type === "smart") return data.value !== undefined

                                                    return false
                                                }) || []
                                        }
                                        onSelect={(data) => {
                                            setSelectedSignalStrengthViewer(data)
                                        }}
                                    />
                                </HStack>
                            ) : (
                                <Text py={2} textAlign={"center"} fontWeight={"bold"}>
                                    Analysis Viewer
                                </Text>
                            )}
                        </HStack>
                        {project && selectedUser && selectedSignalStrengthViewer ? (
                            <SignalStrength
                                username={selectedUser.username || ""}
                                userData={
                                    selectedSignalStrengthViewer || {
                                        value: "0",
                                        description: "No data",
                                        improvements: "No data",
                                        name: signalStrength.name,
                                        summary: "No data",
                                        day: new Date().toISOString().split("T")[0],
                                        maxValue: 0,
                                    }
                                }
                                projectData={project.signalStrengths?.find((s) => s.name === signalStrength.name)!}
                                isUserConnected={true}
                                refreshUserData={() => {}}
                            />
                        ) : (
                            <VStack w={"100%"} h={"200px"} justifyContent={"center"} alignItems={"center"}>
                                <Text>Select a user to view their current analysis</Text>
                            </VStack>
                        )}
                        {selectedUser && (
                            <VStack w={"100%"} gap={5}>
                                <ExtraData
                                    title="Current Analysis Logs"
                                    data={
                                        selectedUser.signalStrengths?.find(
                                            (s) => s.signalStrengthName === signalStrength.name,
                                        )?.data?.[0]
                                    }
                                />
                            </VStack>
                        )}
                    </VStack>
                    <VStack w={"100%"} maxW={"600px"} gap={0}>
                        <HStack w={"100%"} px={3} position="relative" flexWrap={"wrap"} justifyContent={"center"}>
                            <Text w={"100%"} py={2} textAlign={"center"} fontWeight={"bold"}>
                                Test Results{" "}
                                {testTimerStop && !testError ? `(${formatDuration(testTimerDuration)})` : ""}
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
                                userData={testResult[0]}
                                projectData={project?.signalStrengths?.find((s) => s.name === signalStrength.name)!}
                                isUserConnected={true}
                                refreshUserData={() => {}}
                            />
                        ) : selectedUser ? (
                            <VStack w={"100%"} justifyContent={"start"} alignItems={"center"} pt={"50px"}>
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
                                    {testResultsLoading ? formatDuration(testTimerDuration) : "Run test analysis"}
                                </Button>
                                {testError && (
                                    <Text pt={3} px={5} textAlign={"center"} fontWeight={"bold"} color="orange.500">
                                        {testError}
                                    </Text>
                                )}
                            </VStack>
                        ) : selectedUser ? (
                            <VStack w={"100%"} h={"200px"} justifyContent={"center"} alignItems={"center"}>
                                <Text>No new prompt set</Text>
                                <Text>Please set a new prompt</Text>
                            </VStack>
                        ) : (
                            <VStack w={"100%"} h={"200px"} justifyContent={"center"} alignItems={"center"}>
                                <Text>Select a user to test their new analysis</Text>
                            </VStack>
                        )}
                        {testResult && (
                            <VStack w={"100%"} gap={5}>
                                <ExtraData title="Test Result Logs" data={testResult[0]} />
                            </VStack>
                        )}
                    </VStack>
                </HStack>
            </VStack>
        </VStack>
    )
}
