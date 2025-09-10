"use client"

import { VStack, Text } from "@chakra-ui/react"
import SignalStrength from "./SignalStrength"

export default function SignalStrengthContainer({
    currentUser,
    projectSignalStrengths,
    projectData,
    refreshUserData,
}: {
    currentUser: UserData
    projectSignalStrengths: SignalStrengthProjectData[]
    projectData: ProjectData
    refreshUserData: () => void
}) {
    // Match user signal strengths with project signal strengths by name
    const matchedSignalStrengths = projectSignalStrengths.map((projectStrength) => {
        const matchingUserStrength = (currentUser.signalStrengths || []).find(
            (userStrength) => userStrength.signalStrengthName === projectStrength.name,
        )

        // Get the most recent data point if it exists
        const latestData = matchingUserStrength?.data?.[0] || null

        return {
            signalStrengthProjectData: projectStrength,
            userData: latestData || null,
        }
    })

    // Sort matched signal strengths first by status (active first), then by user data value, then by project data maxValue, then alphabetically
    const sortedMatchedSignalStrengths = [...matchedSignalStrengths].sort((a, b) => {
        // First sort by status - active comes first
        if (a.signalStrengthProjectData.status === "active" && b.signalStrengthProjectData.status !== "active")
            return -1
        if (a.signalStrengthProjectData.status !== "active" && b.signalStrengthProjectData.status === "active") return 1

        // Then sort by enabled - enabled comes first
        if (a.signalStrengthProjectData.enabled && !b.signalStrengthProjectData.enabled) return -1
        if (!a.signalStrengthProjectData.enabled && b.signalStrengthProjectData.enabled) return 1

        // Get user values, defaulting to "0" if not available
        const userValueA = a.userData ? parseFloat(a.userData.value) : 0
        const userValueB = b.userData ? parseFloat(b.userData.value) : 0

        // If user values are different, sort by user value (descending)
        if (userValueA !== userValueB) {
            return userValueB - userValueA
        }

        // If user values are the same, sort by project maxValue (descending)
        if (b.signalStrengthProjectData.maxValue !== a.signalStrengthProjectData.maxValue) {
            return b.signalStrengthProjectData.maxValue - a.signalStrengthProjectData.maxValue
        }

        // If maxValues are the same, sort alphabetically by name
        return a.signalStrengthProjectData.name.localeCompare(b.signalStrengthProjectData.name)
    })

    return (
        <VStack gap={3} px={{ base: 0, sm: 3 }} w="100%" maxW="600px" alignItems={"center"} pb={"50px"}>
            <Text fontSize="2xl" fontWeight={"bold"} px={3}>
                📡 Signal Strengths
            </Text>
            <Text color="textColorMuted" textAlign={"center"} px={3}>
                Signal strengths are live measures of engagement in the {projectData.displayName} community.
            </Text>
            <VStack gap={10} alignItems={"start"} w={"100%"}>
                {sortedMatchedSignalStrengths.map(({ signalStrengthProjectData, userData }, index) => (
                    <SignalStrength
                        key={index}
                        username={currentUser.username || ""}
                        userData={
                            userData || {
                                day: "",
                                name: signalStrengthProjectData.name,
                                value: "0",
                                maxValue: signalStrengthProjectData.maxValue,
                                summary: "",
                                description: "",
                                improvements: "",
                            }
                        }
                        historicalData={
                            currentUser.signalStrengths?.find(
                                (s) => s.signalStrengthName === signalStrengthProjectData.name,
                            )?.data || []
                        }
                        timestamp={currentUser.timestamp || 0}
                        projectData={projectData}
                        signalStrengthProjectData={signalStrengthProjectData}
                        refreshUserData={refreshUserData}
                    />
                ))}
            </VStack>
        </VStack>
    )
}
