import { VStack, Text, SimpleGrid } from "@chakra-ui/react"
import PeakSignal from "./PeakSignal"

interface PeakSignalsProps {
    peakSignals: {
        imageSrc: string
        imageAlt: string
        title: string
        value: string
    }[]
}

export default function PeakSignalsContainer({ peakSignals }: PeakSignalsProps) {
    if (peakSignals.length === 0) return null

    return (
        <VStack gap={3} w="100%" alignItems={"start"}>
            <Text fontSize="xl" fontWeight={"bold"}>
                🏔️ Peak Signals
            </Text>
            <SimpleGrid columns={{ base: 2, sm: 3 }} gap={4} mb={8}>
                {peakSignals.map((signal, index) => (
                    <PeakSignal
                        key={index}
                        imageSrc={signal.imageSrc}
                        imageAlt={signal.imageAlt}
                        title={signal.title}
                        value={signal.value}
                    />
                ))}
            </SimpleGrid>
        </VStack>
    )
}
