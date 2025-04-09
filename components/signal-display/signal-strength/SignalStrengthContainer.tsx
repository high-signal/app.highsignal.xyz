import { VStack, Text } from "@chakra-ui/react"
import SignalStrength from "./SignalStrength"

export default function SignalStrengthContainer({
    userSignalStrengths,
    projectSignalStrengths,
}: {
    userSignalStrengths: SignalStrengthUserData[]
    projectSignalStrengths: SignalStrengthProjectData[]
}) {
    // Sort project signal strengths by displayOrderIndex
    const sortedProjectSignalStrengths = [...projectSignalStrengths].sort(
        (a, b) => a.displayOrderIndex - b.displayOrderIndex,
    )

    // Match user signal strengths with project signal strengths by name
    const matchedSignalStrengths = sortedProjectSignalStrengths.map((projectStrength) => {
        const matchingUserStrength = userSignalStrengths.find(
            (userStrength) => userStrength.name === projectStrength.name,
        )
        return {
            projectData: projectStrength,
            userData: matchingUserStrength,
        }
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
                {matchedSignalStrengths.map(({ projectData, userData }, index) => (
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
