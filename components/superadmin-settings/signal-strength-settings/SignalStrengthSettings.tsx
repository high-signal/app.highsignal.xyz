"use client"

import { HStack, VStack } from "@chakra-ui/react"
import { useState, useEffect } from "react"

import HistoricalDataTable from "./HistoricalDataTable"
import SettingsTabbedContent from "../../ui/SettingsTabbedContent"
import SignalStrengthsSettingsHeader from "./SignalStrengthsSettingsHeader"
import SignalStrengthsSettingsCalculation from "./SignalStrengthsSettingsCalculation"

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
                />
                {/* Historical Data Tables */}
                {selectedUser && (
                    <HStack
                        justifyContent={"space-around"}
                        alignItems={"start"}
                        bg={"contentBackground"}
                        w={"100%"}
                        flexWrap={"wrap"}
                    >
                        <HistoricalDataTable
                            title="Current Results"
                            userData={
                                selectedUser.signalStrengths?.find((s) => s.signalStrengthName === signalStrength.name)
                                    ?.data || []
                            }
                            rawUserData={
                                selectedUserRawData?.signalStrengths?.find(
                                    (s) => s.signalStrengthName === signalStrength.name,
                                )?.data || []
                            }
                        />
                        <HistoricalDataTable
                            title="Test Results"
                            userData={testResult || []}
                            rawUserData={testResultRawData || []}
                        />
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
                                />
                            ),
                        },
                    ]}
                />
            </VStack>
        </VStack>
    )
}
