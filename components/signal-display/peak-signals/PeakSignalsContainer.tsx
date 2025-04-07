import { VStack, Text, HStack } from "@chakra-ui/react"
import PeakSignal from "./PeakSignal"

export default function PeakSignalsContainer({ peakSignals }: { peakSignals: PeakSignalUserData[] }) {
    return (
        <VStack gap={3} w="100%" alignItems={"center"} pb={5} justifyContent={"center"}>
            <Text fontSize="2xl" fontWeight={"bold"}>
                🏔️ Peak Signals
            </Text>
            {peakSignals.length === 0 && <Text color="textColor">No peak signals data available for this user.</Text>}
            <HStack
                flexWrap="wrap"
                gap={4}
                py={{ base: 2, sm: 4 }}
                px={2}
                mb={8}
                justify="center"
                maxW="100%"
                w="fit-content"
                bg={"gray.900"}
                borderRadius={{ base: "50px", sm: "50px" }}
            >
                {peakSignals.map((peakSignal, index) => (
                    <PeakSignal key={index} peakSignal={peakSignal} />
                ))}
            </HStack>
        </VStack>
    )
}
