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
            (userStrength) => userStrength.name === projectStrength.name,
        )
        return {
            projectData: projectStrength,
            userData: matchingUserStrength,
        }
    })

    // Sort matched signal strengths first by status (active first), then by user data value, then by project data maxValue, then alphabetically
    const sortedMatchedSignalStrengths = [...matchedSignalStrengths].sort((a, b) => {
        // First sort by status - active comes first
        if (a.projectData.status === "active" && b.projectData.status !== "active") return -1
        if (a.projectData.status !== "active" && b.projectData.status === "active") return 1

        // Get user values, defaulting to "0" if not available
        const userValueA = a.userData ? parseFloat(a.userData.value) : 0
        const userValueB = b.userData ? parseFloat(b.userData.value) : 0

        // If user values are different, sort by user value (descending)
        if (userValueA !== userValueB) {
            return userValueB - userValueA
        }

        // If user values are the same, sort by project maxValue (descending)
        if (b.projectData.maxValue !== a.projectData.maxValue) {
            return b.projectData.maxValue - a.projectData.maxValue
        }

        // If maxValues are the same, sort alphabetically by name
        return a.projectData.name.localeCompare(b.projectData.name)
    })

    return (
        <VStack gap={3} px={{ base: 0, md: 3 }} w="100%" maxW="600px" alignItems={"center"} pb={"50px"}>
            <Text fontSize="2xl" fontWeight={"bold"} px={3}>
                📡 Signal Strength
            </Text>
            <Text color="textColorMuted" textAlign={"center"} px={3}>
                Signal strengths are live measures of engagement in the {projectData.displayName} community.
            </Text>
            <VStack gap={10} alignItems={"start"} w={"100%"}>
                {sortedMatchedSignalStrengths.map(({ projectData, userData }, index) => (
                    <SignalStrength
                        key={index}
                        username={currentUser.username || ""}
                        userData={
                            userData || {
                                name: projectData.name,
                                value: "0",
                                summary: "",
                                description: "",
                                improvements: "",
                            }
                        }
                        projectData={projectData}
                        isUserConnected={userData ? true : false}
                        refreshUserData={refreshUserData}
                    />
                ))}
            </VStack>
        </VStack>
    )
}
