import { VStack, Text } from "@chakra-ui/react"
import SignalStrength from "./SignalStrength"

export default function SignalStrengthContainer({ signalStrengths }: { signalStrengths: SignalStrengthData[] }) {
    return (
        <VStack gap={3} w="100%" maxW="600px" alignItems={"center"} pb={"100px"}>
            <Text fontSize="2xl" fontWeight={"bold"}>
                📡 Signal Strength
            </Text>

            {signalStrengths.length === 0 && (
                <Text color="textColor">No signal strength data available for this user.</Text>
            )}

            <VStack gap={10} alignItems={"start"} w={"100%"}>
                {signalStrengths.map((signalStrength, index) => (
                    <SignalStrength key={index} data={signalStrength} />
                ))}
            </VStack>
        </VStack>
    )
}
