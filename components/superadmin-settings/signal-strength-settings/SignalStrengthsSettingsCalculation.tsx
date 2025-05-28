"use client"

import { HStack, Text, VStack, Box, Textarea, Button } from "@chakra-ui/react"
import { useState } from "react"

import { getAccessToken } from "@privy-io/react-auth"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowRight, faRefresh } from "@fortawesome/free-solid-svg-icons"

import SignalStrength from "../../signal-display/signal-strength/SignalStrength"
import SingleLineTextInput from "../../ui/SingleLineTextInput"

export default function SignalStrengthsSettingsCalculation({
    type,
    signalStrength,
    project,
    selectedUser,
    testResult,
    setTestResult,
    setTestTimerStart,
    testTimerStop,
    setTestTimerStop,
    testTimerDuration,
    setTestTimerDuration,
    testResultsLoading,
    setTestResultsLoading,
    testError,
    setTestError,
    testMaxDuration,
    setTestResultRawData,
    newSignalStrengthUsername,
}: {
    type: "raw" | "smart"
    signalStrength: SignalStrengthData
    project: ProjectData | null
    selectedUser: UserData | null
    testResult: SignalStrengthUserData[] | null
    setTestResult: (result: SignalStrengthUserData[] | null) => void
    setTestTimerStart: (start: number) => void
    testTimerStop: number | null
    setTestTimerStop: (stop: number | null) => void
    testTimerDuration: number | null
    setTestTimerDuration: (duration: number | null) => void
    testResultsLoading: boolean
    setTestResultsLoading: (loading: boolean) => void
    testError: string | null
    setTestError: (error: string | null) => void
    testMaxDuration: number
    setTestResultRawData: (result: SignalStrengthUserData[] | null) => void
    newSignalStrengthUsername: string
}) {
    const [newModel, setNewModel] = useState<string>("")
    const [newTemperature, setNewTemperature] = useState<string>("")
    const [newMaxChars, setNewMaxChars] = useState<string>("")
    const [newPrompt, setNewPrompt] = useState<string>("")

    // Format duration to show seconds and tenths
    const formatDuration = (duration: number | null) => {
        if (duration === null) return "0.0s"
        return `${(duration / 1000).toFixed(1)}s`
    }

    const fetchTestResult = async () => {
        setTestTimerStart(Date.now())
        setTestTimerStop(null)
        setTestTimerDuration(null)

        setTestResultsLoading(true)
        setTestResult(null)
        setTestError(null)

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
                    testingSignalStrengthUsername: newSignalStrengthUsername,
                }),
            },
        )

        // If response is 200, start a polling loop to check if the test is complete
        if (testingResponse.ok) {
            const testStartTime = Date.now()
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

                // If the smart score is found in the DB then the test is complete
                const foundSignalStrength = testResult[0].signalStrengths?.find(
                    (ss: SignalStrengthData) => ss.signalStrengthName === signalStrength.name,
                )

                if (foundSignalStrength) {
                    setTestResult(foundSignalStrength.data)
                    setTestResultsLoading(false)
                    setTestTimerStop(Date.now())

                    // Then fetch the test result raw user data
                    const testResultRawData = await fetch(
                        `/api/superadmin/users/?project=${project?.urlSlug}&user=${selectedUser?.username}&showTestDataOnly=true&showRawScoreCalcOnly=true`,
                        {
                            method: "GET",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    )

                    const testResultRawDataJson = await testResultRawData.json()

                    setTestResultRawData(
                        testResultRawDataJson[0].signalStrengths?.find(
                            (ss: SignalStrengthData) => ss.signalStrengthName === signalStrength.name,
                        )?.data,
                    )
                } else {
                    // If no result yet, poll again after 1 second
                    // Stop polling if the duration exceeds the max duration
                    const currentDuration = Date.now() - testStartTime
                    if (currentDuration < testMaxDuration) {
                        setTimeout(pollTestResult, 1000)
                    }
                }
            }

            // Start the polling loop
            // Add a small delay as the poll does not need to start immediately
            setTimeout(pollTestResult, 3000)
        }
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
            <VStack w={"100%"} justifyContent={"center"} bg={"contentBackground"} pt={4}>
                <Text>Type: {type}</Text>
            </VStack>
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
                <HStack w={"100%"} justifyContent={"space-around"} alignItems={"start"} flexWrap={"wrap"} pb={5}>
                    <VStack w={"100%"} maxW={"600px"} gap={0}>
                        <Box w={"100%"} px={3}>
                            <Text w={"100%"} py={2} textAlign={"center"} fontWeight={"bold"}>
                                Current Analysis{" "}
                                {project &&
                                    selectedUser &&
                                    "(ID: " +
                                        selectedUser.signalStrengths?.find(
                                            (s) => s.signalStrengthName === signalStrength.name,
                                        )?.data?.[0]?.promptId +
                                        ")"}
                            </Text>
                        </Box>
                        {project && selectedUser ? (
                            <SignalStrength
                                username={selectedUser.username || ""}
                                userData={
                                    selectedUser.signalStrengths?.find(
                                        (s) => s.signalStrengthName === signalStrength.name,
                                    )?.data?.[0] || {
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
