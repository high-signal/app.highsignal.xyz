import { VStack, Text, SimpleGrid } from "@chakra-ui/react"
import PeakSignal from "./PeakSignal"

export default function PeakSignalsContainer({ peakSignals }: { peakSignals: PeakSignal[] }) {
    if (peakSignals.length === 0) return null

    return (
        <VStack gap={3} w="100%" alignItems={"start"}>
            <Text fontSize="xl" fontWeight={"bold"}>
                🏔️ Peak Signals
            </Text>
            <SimpleGrid columns={{ base: 2, sm: 3 }} gap={4} mb={8}>
                {peakSignals.map((peakSignal, index) => (
                    <PeakSignal key={index} peakSignal={peakSignal} />
                ))}
            </SimpleGrid>
        </VStack>
    )
}
