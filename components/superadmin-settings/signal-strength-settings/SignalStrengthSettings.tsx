"use client"

import { HStack, VStack, Text } from "@chakra-ui/react"
import { useState } from "react"
import { getAccessToken } from "@privy-io/react-auth"

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
    newUserSelectedTrigger, // TODO: Do I still need this?
}: {
    signalStrength: SignalStrengthData
    project: ProjectData | null
    selectedUser: UserData | null
    newUserSelectedTrigger: boolean
}) {
    const [selectedUserRawData, setSelectedUserRawData] = useState<UserData | null>(null)
    const [newSignalStrengthUsername, setNewSignalStrengthUsername] = useState<string>("")

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
        maxDuration: 30000,
        onTimeout: () => setTestResultsLoading(false),
    })

    const [testResult, setTestResult] = useState<SignalStrengthUserData[] | null>(null)
    const [testResultsLoading, setTestResultsLoading] = useState(false)
    const [testResultRawData, setTestResultRawData] = useState<SignalStrengthUserData[] | null>(null)

    const [rawTestingInputData, setRawTestingInputData] = useState<TestingInputData | null>(null)
    const [smartTestingInputData, setSmartTestingInputData] = useState<TestingInputData | null>(null)

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

    // function resetTest() {
    //     setTestResult(null)
    //     setNewModel("")
    //     setNewTemperature("")
    //     setNewMaxChars("")
    //     setNewPrompt("")
    //     setTestResultsLoading(false)
    //     setTestTimerStart(null)
    //     setTestTimerStop(null)
    //     setTestTimerDuration(null)
    //     setNewSignalStrengthUsername("")
    //     setTestError(null)
    // }

    return (
        <VStack w="100%" gap={4}>
            <VStack w="100%" gap={0} borderBottomRadius={{ base: 0, sm: "16px" }} overflow={"hidden"}>
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
                                        // setTestResult(null)
                                    }}
                                    placeholder={`New ${signalStrength.displayName.split(" ")[0].toLowerCase()} username... (optional)`}
                                    handleClear={() => {
                                        setNewSignalStrengthUsername("")
                                        // setTestResult(null)
                                    }}
                                    bg="pageBackground"
                                />

                                <HistoricalDataTable
                                    title="Test Results"
                                    userData={testResult || []}
                                    rawUserData={testResultRawData || []}
                                />
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
                            label: "Raw Calculation",
                            content: (
                                <SignalStrengthsSettingsCalculation
                                    type="raw"
                                    signalStrength={signalStrength}
                                    project={project}
                                    selectedUser={selectedUser}
                                    fetchTestResult={fetchTestResult}
                                    testResult={testResult}
                                    setTestResult={setTestResult}
                                    setTestTimerStart={setTestTimerStart}
                                    testTimerStop={testTimerStop}
                                    testTimerDuration={testTimerDuration}
                                    testResultsLoading={testResultsLoading}
                                    testError={testError}
                                    testingInputData={rawTestingInputData}
                                    setTestingInputData={setRawTestingInputData}
                                />
                            ),
                        },
                        {
                            value: "smart",
                            label: "Smart Calculation",
                            content: (
                                <SignalStrengthsSettingsCalculation
                                    type="smart"
                                    signalStrength={signalStrength}
                                    project={project}
                                    selectedUser={selectedUser}
                                    fetchTestResult={fetchTestResult}
                                    testResult={testResult}
                                    setTestResult={setTestResult}
                                    setTestTimerStart={setTestTimerStart}
                                    testTimerStop={testTimerStop}
                                    testTimerDuration={testTimerDuration}
                                    testResultsLoading={testResultsLoading}
                                    testError={testError}
                                    testingInputData={smartTestingInputData}
                                    setTestingInputData={setSmartTestingInputData}
                                />
                            ),
                        },
                    ]}
                />
            </VStack>
        </VStack>
    )
}
