"use client"

import { HStack, VStack, Text, Box } from "@chakra-ui/react"
import { useEffect, useState, useCallback } from "react"
import { getAccessToken } from "@privy-io/react-auth"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFilePen } from "@fortawesome/free-solid-svg-icons"

import { APP_CONFIG } from "../../../config/constants"

import HistoricalDataTable from "./HistoricalDataTable"
import SettingsTabbedContent from "../../ui/SettingsTabbedContent"
import SignalStrengthsSettingsHeader from "./SignalStrengthsSettingsHeader"
import SignalStrengthsSettingsCalculation from "./SignalStrengthsSettingsCalculation"
import SingleLineTextInput from "../../ui/SingleLineTextInput"

import { useTestTimer } from "../../../hooks/useTestTimer"

export default function SignalStrengthSettings({
    signalStrength,
    project,
    selectedUser,
    selectedUserRawData,
    newUserSelectedTrigger,
}: {
    signalStrength: SignalStrengthData
    project: ProjectData | null
    selectedUser: UserData | null
    selectedUserRawData: UserData | null
    newUserSelectedTrigger: boolean
}) {
    const [newSignalStrengthUsername, setNewSignalStrengthUsername] = useState<string>("")
    const [testResult, setTestResult] = useState<SignalStrengthUserData[] | null>(null)
    const [testResultsLoading, setTestResultsLoading] = useState(false)
    const [testResultRawData, setTestResultRawData] = useState<SignalStrengthUserData[] | null>(null)

    const [rawTestingInputData, setRawTestingInputData] = useState<TestingInputData>({})
    const [smartTestingInputData, setSmartTestingInputData] = useState<TestingInputData>({})

    const signalStrengthUsername =
        selectedUser?.connectedAccounts
            ?.find((accountType) => accountType.name === signalStrength.name)
            ?.data?.find((forumUser) => Number(forumUser.projectId) === Number(project?.id))?.forumUsername || ""

    const {
        setTestTimerStart,
        testTimerStop,
        setTestTimerStop,
        testTimerDuration,
        setTestTimerDuration,
        testError,
        setTestError,
    } = useTestTimer({
        onTimeout: () => setTestResultsLoading(false),
    })

    const resetTest = useCallback(() => {
        setTestResult(null)
        setTestResultRawData(null)
        setTestResultsLoading(false)
        setTestTimerStart(null)
        setTestTimerStop(null)
        setTestTimerDuration(null)
        setTestError(null)
    }, [
        setTestResult,
        setTestResultRawData,
        setTestResultsLoading,
        setTestTimerStart,
        setTestTimerStop,
        setTestTimerDuration,
        setTestError,
    ])

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
                    signalStrengthName: signalStrength.name,
                    targetUsername: selectedUser?.username,
                    testingInputData: {
                        testingSignalStrengthUsername: newSignalStrengthUsername,
                        rawTestingInputData: rawTestingInputData || {},
                        smartTestingInputData: smartTestingInputData || {},
                    },
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
                    if (currentDuration < APP_CONFIG.TEST_TIMER_MAX_DURATION) {
                        setTimeout(pollTestResult, 1000)
                    }
                }
            }

            // Start the polling loop
            // Add a small delay as the poll does not need to start immediately
            setTimeout(pollTestResult, 3000)
        }
    }

    // Reset the new signal strength username when a new user is selected
    useEffect(() => {
        setNewSignalStrengthUsername("")
    }, [newUserSelectedTrigger])

    // Reset the test when a new user is selected or the new signal strength username is changed
    useEffect(() => {
        if (!selectedUser) {
            resetTest()
        }
    }, [resetTest, newUserSelectedTrigger, newSignalStrengthUsername, selectedUser])

    // Helper function to check if the testing data has been modified
    const hasModifiedTestingInputs = (data: TestingInputData): boolean => {
        return Object.values(data).some((value) => value !== null && value !== "" && value !== undefined)
    }

    return (
        <VStack w="100%" gap={4}>
            <VStack w="100%" gap={0} borderBottomRadius={{ base: 0, sm: "16px" }} overflow={"hidden"} maxW={"1200px"}>
                <SignalStrengthsSettingsHeader
                    signalStrength={signalStrength}
                    project={project}
                    selectedUser={selectedUser}
                    signalStrengthUsername={signalStrengthUsername}
                />
                {/* Historical Data Tables and Usernames */}
                {selectedUser && (
                    <HStack
                        justifyContent={"center"}
                        alignItems={"start"}
                        bg={"contentBackground"}
                        w={"100%"}
                        flexWrap={"wrap"}
                        gap={{ base: 4, lg: 20 }}
                        px={3}
                        pt={4}
                    >
                        <VStack flex={1} alignItems={{ base: "center", lg: "end" }}>
                            <VStack gap={4}>
                                <HStack
                                    bg={"pageBackground"}
                                    alignItems={"center"}
                                    borderRadius={"full"}
                                    px={4}
                                    py={2}
                                    flexWrap={"wrap"}
                                    gap={3}
                                >
                                    <HStack flexWrap={"wrap"} columnGap={3} rowGap={1} justifyContent={"center"}>
                                        <Text>{signalStrength.displayName.split(" ")[0]} username</Text>
                                        <Text
                                            fontWeight={"bold"}
                                            color={signalStrengthUsername ? "inherit" : "textColorMuted"}
                                        >
                                            {selectedUser && signalStrengthUsername
                                                ? signalStrengthUsername
                                                : selectedUser && !signalStrengthUsername
                                                  ? "Not connected"
                                                  : "Select a user"}
                                        </Text>
                                    </HStack>
                                </HStack>
                                <HistoricalDataTable
                                    title="Current Results"
                                    userData={
                                        selectedUser.signalStrengths?.find(
                                            (s) => s.signalStrengthName === signalStrength.name,
                                        )?.data || []
                                    }
                                    rawUserData={
                                        selectedUserRawData?.signalStrengths?.find(
                                            (s) => s.signalStrengthName === signalStrength.name,
                                        )?.data || []
                                    }
                                />
                                {!selectedUser.signalStrengths?.find(
                                    (s) => s.signalStrengthName === signalStrength.name,
                                )?.data && <Text pb={4}>No data found</Text>}
                            </VStack>
                        </VStack>
                        <VStack flex={1} alignItems={{ base: "center", lg: "start" }}>
                            <VStack gap={4}>
                                <SingleLineTextInput
                                    maxW={"300px"}
                                    minW={"300px"}
                                    h={"40px"}
                                    value={newSignalStrengthUsername}
                                    onChange={(e) => {
                                        setNewSignalStrengthUsername(e.target.value)
                                    }}
                                    placeholder={`New ${signalStrength.displayName.split(" ")[0].toLowerCase()} username... (optional)`}
                                    handleClear={() => {
                                        setNewSignalStrengthUsername("")
                                    }}
                                    bg="pageBackground"
                                />

                                <HistoricalDataTable
                                    title="Test Results"
                                    userData={testResult || []}
                                    rawUserData={testResultRawData || []}
                                />
                                {!testResult && !testResultRawData && (
                                    <Text pb={4}>Run a test to see the results here</Text>
                                )}
                            </VStack>
                        </VStack>
                    </HStack>
                )}
            </VStack>
            <VStack w="100%" pb={2} gap={4}>
                <SettingsTabbedContent
                    tabs={[
                        {
                            value: "raw",
                            label: (
                                <HStack>
                                    <Text>Raw Calculation</Text>
                                    {hasModifiedTestingInputs(rawTestingInputData) && (
                                        <Box
                                            position={"absolute"}
                                            right={{ base: 0, sm: 2 }}
                                            fontSize={"xl"}
                                            color={"orange.500"}
                                        >
                                            <FontAwesomeIcon icon={faFilePen} />
                                        </Box>
                                    )}
                                </HStack>
                            ),
                            content: (
                                <SignalStrengthsSettingsCalculation
                                    type="raw"
                                    signalStrength={signalStrength}
                                    project={project}
                                    selectedUser={selectedUserRawData}
                                    fetchTestResult={fetchTestResult}
                                    testResult={testResultRawData}
                                    setTestTimerStart={setTestTimerStart}
                                    testTimerStop={testTimerStop}
                                    testTimerDuration={testTimerDuration}
                                    testResultsLoading={testResultsLoading}
                                    testError={testError}
                                    testingInputData={rawTestingInputData}
                                    setTestingInputData={setRawTestingInputData}
                                    resetTest={resetTest}
                                />
                            ),
                        },
                        {
                            value: "smart",
                            label: (
                                <HStack>
                                    <Text>Smart Calculation</Text>
                                    {hasModifiedTestingInputs(smartTestingInputData) && (
                                        <Box
                                            position={"absolute"}
                                            right={{ base: 0, sm: 2 }}
                                            fontSize={"xl"}
                                            color={"orange.500"}
                                        >
                                            <FontAwesomeIcon icon={faFilePen} />
                                        </Box>
                                    )}
                                </HStack>
                            ),
                            content: (
                                <SignalStrengthsSettingsCalculation
                                    type="smart"
                                    signalStrength={signalStrength}
                                    project={project}
                                    selectedUser={selectedUser}
                                    fetchTestResult={fetchTestResult}
                                    testResult={testResult}
                                    setTestTimerStart={setTestTimerStart}
                                    testTimerStop={testTimerStop}
                                    testTimerDuration={testTimerDuration}
                                    testResultsLoading={testResultsLoading}
                                    testError={testError}
                                    testingInputData={smartTestingInputData}
                                    setTestingInputData={setSmartTestingInputData}
                                    resetTest={resetTest}
                                />
                            ),
                        },
                    ]}
                />
            </VStack>
        </VStack>
    )
}
