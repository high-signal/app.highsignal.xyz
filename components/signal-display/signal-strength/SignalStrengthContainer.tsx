"use client"

import { VStack, Text, HStack } from "@chakra-ui/react"
import SignalStrength from "./SignalStrength"

import { useUser } from "../../../contexts/UserContext"

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
    const { loggedInUser } = useUser()

    // Match user signal strengths with project signal strengths by name
    const matchedSignalStrengths = projectSignalStrengths.map((projectStrength) => {
        const matchingUserStrength = (currentUser.signalStrengths || []).find(
            (userStrength) => userStrength.signalStrengthName === projectStrength.name,
        )

        // Get the most recent data point if it exists
        let latestData = matchingUserStrength?.data?.[0] || null

        if (loggedInUser?.username === currentUser.username || loggedInUser?.isSuperAdmin) {
            if (
                latestData &&
                (matchingUserStrength?.data?.[0].value === "0" || !matchingUserStrength?.data?.[0].value)
            ) {
                latestData.description = `No activity in the past ${projectStrength.previousDays} days`
            }
        }

        return {
            signalStrengthProjectData: projectStrength,
            userData: latestData || null,
        }
    })

    // Keep only "active" and enabled items, then sort
    const sortedMatchedSignalStrengths = matchedSignalStrengths
        .filter((s) => s.signalStrengthProjectData.status === "active" && s.signalStrengthProjectData.enabled)
        .filter((s) => {
            // If username starts with ~, filter out signal strengths where userData is null
            if (currentUser.username?.startsWith("~") && !s.userData) {
                return false
            }
            return true
        })
        .sort((a, b) => {
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
        <VStack gap={3} px={{ base: 0, sm: 3 }} w="100%" maxW="1400px" alignItems={"center"} pb={"50px"}>
            <Text fontSize="2xl" fontWeight={"bold"} px={3}>
                📡 Signals
            </Text>
            <Text color="textColorMuted" textAlign={"center"} px={{ base: 3, sm: 0 }}>
                Signals are live measures of activity in the {projectData.displayName} community.
            </Text>
            <HStack
                rowGap={10}
                columnGap={8}
                alignItems={"start"}
                w={"100%"}
                flexWrap={"wrap"}
                justifyContent={"center"}
            >
                {sortedMatchedSignalStrengths.map(({ signalStrengthProjectData, userData }, index) => (
                    <SignalStrength
                        key={index}
                        userDisplayName={currentUser.displayName || ""}
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
                        dailyData={
                            currentUser.signalStrengths?.find(
                                (s) => s.signalStrengthName === signalStrengthProjectData.name,
                            )?.dailyData || []
                        }
                        timestamp={currentUser.timestamp || 0}
                        projectData={projectData}
                        signalStrengthProjectData={signalStrengthProjectData}
                        refreshUserData={refreshUserData}
                        userProjectScore={currentUser.score || 0}
                    />
                ))}
            </HStack>
        </VStack>
    )
}
