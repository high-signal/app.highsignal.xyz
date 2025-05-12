import { VStack, Text, Grid, GridItem, HStack, Box } from "@chakra-ui/react"
import PeakSignal from "./PeakSignal"

export default function PeakSignalsContainer({
    currentUser,
    peakSignals,
    projectData,
}: {
    currentUser: UserData
    peakSignals: PeakSignalUserData[]
    projectData: ProjectData
}) {
    const sortedSignals = [...peakSignals].sort((a, b) => b.value - a.value)
    const isOddCount = sortedSignals.length % 2 !== 0
    const isLastItem = (index: number) => index === sortedSignals.length - 1

    const percentageCompleted = (Number(currentUser.peakSignalScore) / Number(projectData.peakSignalsMaxValue)) * 100
    const completedBarWidth = percentageCompleted > 100 ? "100%" : `${percentageCompleted}%`

    return (
        <VStack gap={3} w={"100%"} alignItems={"center"} px={3} justifyContent={"center"}>
            <HStack w="100%" justifyContent={"center"} gap={3}>
                <Text fontSize="2xl" fontWeight={"bold"}>
                    🏔️ Peak Signals
                </Text>
                <HStack
                    gap={"2px"}
                    bg={completedBarWidth !== "0%" ? "lozenge.background.active" : "lozenge.background.disabled"}
                    fontSize="xl"
                    px={2}
                    borderRadius="8px"
                    color={completedBarWidth !== "0%" ? "lozenge.text.active" : "lozenge.text.disabled"}
                >
                    {completedBarWidth !== "0%" && <Text>+</Text>}
                    <Text>{currentUser.peakSignalScore}</Text>
                </HStack>
            </HStack>
            <HStack
                w="100%"
                maxW="550px"
                justifyContent={"space-between"}
                alignItems={"center"}
                fontSize={"lg"}
                color={"gray.400"}
                px={1}
            >
                <Text fontFamily={"monospace"}>0</Text>
                <HStack w="100%" h="30px" bg="gray.800" borderRadius="md" overflow="hidden">
                    <Box
                        w={completedBarWidth}
                        h="100%"
                        bg="lozenge.background.active"
                        border={
                            completedBarWidth === "100%" ? "2px solid" : completedBarWidth === "0%" ? "none" : "none"
                        }
                        borderRight={
                            completedBarWidth === "100%"
                                ? "2px solid"
                                : completedBarWidth === "0%"
                                  ? "none"
                                  : "3px solid"
                        }
                        borderRadius={completedBarWidth === "100%" ? "md" : "none"}
                        borderColor="lozenge.border.active"
                    />
                </HStack>
                <Text fontFamily={"monospace"}>{projectData.peakSignalsMaxValue}</Text>
            </HStack>
            <Text color="textColorMuted" textAlign={"center"} px={2}>
                Peak signals highlight achievements in the {projectData.displayName} community.
            </Text>
            {peakSignals.length === 0 && (
                <Text
                    color="textColorMuted"
                    bg={"contentBackground"}
                    borderRadius={{ base: "50px", md: "60px" }}
                    py={2}
                    px={4}
                >
                    {currentUser.displayName} has no peak signals yet
                </Text>
            )}
            {peakSignals.length > 0 && (
                <Grid
                    templateColumns={
                        peakSignals.length === 1 ? { base: "1fr", md: "1fr" } : { base: "1fr", md: "1fr 1fr" }
                    }
                    gap={4}
                    py={{ base: 2, md: 4 }}
                    px={{ base: 2, md: 4 }}
                    bg={"contentBackground"}
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
