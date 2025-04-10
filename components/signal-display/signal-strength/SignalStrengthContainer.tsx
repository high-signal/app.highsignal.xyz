import { VStack, Text } from "@chakra-ui/react"
import SignalStrength from "./SignalStrength"

export default function SignalStrengthContainer({
    userSignalStrengths,
    projectSignalStrengths,
}: {
    userSignalStrengths: SignalStrengthUserData[]
    projectSignalStrengths: SignalStrengthProjectData[]
}) {
    // Match user signal strengths with project signal strengths by name
    const matchedSignalStrengths = projectSignalStrengths.map((projectStrength) => {
        const matchingUserStrength = userSignalStrengths.find(
            (userStrength) => userStrength.name === projectStrength.name,
        )
        return {
            projectData: projectStrength,
            userData: matchingUserStrength,
        }
    })

    // Sort matched signal strengths first by user data value, then by project data maxValue
    const sortedMatchedSignalStrengths = [...matchedSignalStrengths].sort((a, b) => {
        // Get user values, defaulting to "0" if not available
        const userValueA = a.userData ? parseFloat(a.userData.value) : 0
        const userValueB = b.userData ? parseFloat(b.userData.value) : 0

        // If user values are different, sort by user value (descending)
        if (userValueA !== userValueB) {
            return userValueB - userValueA
        }

        // If user values are the same, sort by project maxValue (descending)
        return b.projectData.maxValue - a.projectData.maxValue
    })

    return (
        <VStack gap={3} w="100%" alignItems={"center"} pb={"50px"}>
            <Text fontSize="2xl" fontWeight={"bold"}>
                📡 Signal Strength
            </Text>

            {userSignalStrengths.length === 0 && (
                <Text color="textColor">No signal strength data available for this user.</Text>
            )}

            <VStack gap={10} alignItems={"start"} w={"100%"}>
                {sortedMatchedSignalStrengths.map(({ projectData, userData }, index) => (
                    <SignalStrength
                        key={index}
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
                    />
                ))}
            </VStack>
        </VStack>
    )
}
