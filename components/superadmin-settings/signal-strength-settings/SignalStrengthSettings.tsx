"use client"

import { HStack, VStack, Text } from "@chakra-ui/react"
import { useState, useEffect } from "react"

import HistoricalDataTable from "./HistoricalDataTable"
import SettingsTabbedContent from "../../ui/SettingsTabbedContent"
import SignalStrengthsSettingsHeader from "./SignalStrengthsSettingsHeader"
import SignalStrengthsSettingsCalculation from "./SignalStrengthsSettingsCalculation"
import SingleLineTextInput from "../../ui/SingleLineTextInput"

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

    // TEST TIMER ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
    const [testTimerStart, setTestTimerStart] = useState<number | null>(null)
    const [testTimerStop, setTestTimerStop] = useState<number | null>(null)
    const [testTimerDuration, setTestTimerDuration] = useState<number | null>(null)
    const [testError, setTestError] = useState<string | null>(null)

    const testMaxDuration = 30000 // 30 seconds

    useEffect(() => {
        let intervalId: NodeJS.Timeout

        if (testTimerStart && !testTimerStop) {
            // Update timer every 100ms while test is running
            intervalId = setInterval(() => {
                const currentDuration = Date.now() - testTimerStart
                // Stop if duration exceeds max duration
                if (currentDuration > testMaxDuration) {
                    setTestTimerStop(Date.now())
                    setTestTimerDuration(testMaxDuration)
                    setTestResultsLoading(false)
                    setTestError(
                        `Test timed out after ${testMaxDuration / 1000}s. Try again and check the inputs are correct.`,
                    )
                    return
                }
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

    // TEST TIMER ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑

    // const [project, setProject] = useState<ProjectData | null>(null)

    const [testResult, setTestResult] = useState<SignalStrengthUserData[] | null>(null)
    const [testResultsLoading, setTestResultsLoading] = useState(false)
    const [testResultRawData, setTestResultRawData] = useState<SignalStrengthUserData[] | null>(null)

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
                                    testResult={testResult}
                                    setTestResult={setTestResult}
                                    setTestTimerStart={setTestTimerStart}
                                    testTimerStop={testTimerStop}
                                    setTestTimerStop={setTestTimerStop}
                                    testTimerDuration={testTimerDuration}
                                    setTestTimerDuration={setTestTimerDuration}
                                    testResultsLoading={testResultsLoading}
                                    setTestResultsLoading={setTestResultsLoading}
                                    testError={testError}
                                    setTestError={setTestError}
                                    testMaxDuration={testMaxDuration}
                                    setTestResultRawData={setTestResultRawData}
                                    newSignalStrengthUsername={newSignalStrengthUsername}
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
                                    testResult={testResult}
                                    setTestResult={setTestResult}
                                    setTestTimerStart={setTestTimerStart}
                                    testTimerStop={testTimerStop}
                                    setTestTimerStop={setTestTimerStop}
                                    testTimerDuration={testTimerDuration}
                                    setTestTimerDuration={setTestTimerDuration}
                                    testResultsLoading={testResultsLoading}
                                    setTestResultsLoading={setTestResultsLoading}
                                    testError={testError}
                                    setTestError={setTestError}
                                    testMaxDuration={testMaxDuration}
                                    setTestResultRawData={setTestResultRawData}
                                    newSignalStrengthUsername={newSignalStrengthUsername}
                                />
                            ),
                        },
                    ]}
                />
            </VStack>
        </VStack>
    )
}
