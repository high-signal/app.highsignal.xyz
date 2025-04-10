import { VStack, Text, Grid, GridItem } from "@chakra-ui/react"
import PeakSignal from "./PeakSignal"

export default function PeakSignalsContainer({
    currentUserDisplayName,
    peakSignals,
}: {
    currentUserDisplayName: string
    peakSignals: PeakSignalUserData[]
}) {
    const sortedSignals = [...peakSignals].sort((a, b) => b.value - a.value)
    const isOddCount = sortedSignals.length % 2 !== 0
    const isLastItem = (index: number) => index === sortedSignals.length - 1

    return (
        <VStack gap={3} w={"100%"} alignItems={"center"} pb={5} px={3} justifyContent={"center"}>
            <Text fontSize="2xl" fontWeight={"bold"}>
                🏔️ Peak Signals
            </Text>
            {peakSignals.length === 0 && (
                <Text color="textColor">{currentUserDisplayName} has no peak signals yet.</Text>
            )}
            {peakSignals.length > 0 && (
                <Grid
                    templateColumns={
                        peakSignals.length === 1 ? { base: "1fr", md: "1fr" } : { base: "1fr", md: "1fr 1fr" }
                    }
                    gap={4}
                    py={{ base: 2, md: 4 }}
                    px={{ base: 2, md: 4 }}
                    mb={8}
                    bg={"gray.900"}
                    borderRadius={{ base: "50px", md: "60px" }}
                    w={{ base: "100%", md: peakSignals.length === 1 ? "fit-content" : "100%" }}
                    maxW="100%"
                    overflow="hidden"
                >
                    {sortedSignals.map((peakSignal, index) => (
                        <GridItem
                            key={index}
                            gridColumn={isOddCount && isLastItem(index) ? { base: "1", md: "1 / span 2" } : undefined}
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            w="100%"
                            maxW="100%"
                            overflow="hidden"
                        >
                            <PeakSignal peakSignal={peakSignal} />
                        </GridItem>
                    ))}
                </Grid>
            )}
        </VStack>
    )
}
