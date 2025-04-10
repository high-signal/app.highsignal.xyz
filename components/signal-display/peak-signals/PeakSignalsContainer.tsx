import { VStack, Text, HStack } from "@chakra-ui/react"
import PeakSignal from "./PeakSignal"

export default function PeakSignalsContainer({
    currentUserDisplayName,
    peakSignals,
}: {
    currentUserDisplayName: string
    peakSignals: PeakSignalUserData[]
}) {
    return (
        <VStack gap={3} w={"100%"} alignItems={"center"} pb={5} px={3} justifyContent={"center"}>
            <Text fontSize="2xl" fontWeight={"bold"}>
                🏔️ Peak Signals
            </Text>
            {peakSignals.length === 0 && (
                <Text color="textColor">{currentUserDisplayName} has no peak signals yet.</Text>
            )}
            {peakSignals.length > 0 && (
                <VStack
                    flexWrap="wrap"
                    gap={4}
                    py={{ base: 2, sm: 4 }}
                    px={{ base: 2, sm: 4 }}
                    mb={8}
                    justifyContent={"center"}
                    bg={"gray.900"}
                    borderRadius={"50px"}
                >
                    {[...peakSignals]
                        .sort((a, b) => b.value - a.value)
                        .map((peakSignal, index) => (
                            <PeakSignal key={index} peakSignal={peakSignal} />
                        ))}
                </VStack>
            )}
        </VStack>
    )
}
