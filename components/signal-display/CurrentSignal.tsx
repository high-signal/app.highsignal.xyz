import { VStack, HStack, Text, Box, Span, Spinner, Skeleton } from "@chakra-ui/react"
import { calculateSignalPercentageFromName, calculateSignalThresholdFromName } from "../../utils/calculateSignal"
import { useEffect, useState } from "react"
import { APP_CONFIG } from "../../config/constants"

export default function CurrentSignal({ currentUser }: { currentUser: UserData }) {
    const [isSignalStrengthLoading, setIsSignalStrengthLoading] = useState(false)

    const signal = currentUser.signal
    const signalValue = currentUser.score

    // If lastChecked for any of the signal strengths is less than X seconds ago, set isSignalStrengthLoading to true
    useEffect(() => {
        const isSignalStrengthLoading = (currentUser.signalStrengths || []).some((signalStrength) => {
            if (!signalStrength.lastChecked) return false
            const now = Date.now()
            const lastCheckedTime = signalStrength.lastChecked * 1000 // Convert to milliseconds
            const timeElapsed = now - lastCheckedTime
            return timeElapsed < APP_CONFIG.SIGNAL_STRENGTH_LOADING_DURATION
        })
        setIsSignalStrengthLoading(isSignalStrengthLoading)
    }, [currentUser])

    return (
        <VStack w="100%" maxW="600px" gap={1}>
            <HStack
                justifyContent={"center"}
                alignItems={"center"}
                gap={5}
                fontSize={{ base: "40px", sm: "50px" }}
                fontWeight="bold"
                pb={2}
                w={"100%"}
                flexWrap={"wrap"}
            >
                {isSignalStrengthLoading ? (
                    <Skeleton
                        defaultSkeleton
                        w={{ base: "200px", sm: "250px" }}
                        h={{ base: "70px", sm: "85px" }}
                        borderRadius={"25px"}
                    />
                ) : (
                    <Text textAlign={"center"}>
                        <Span color={`scoreColor.${signal || "gray.500"}`}>
                            {(signal || "").charAt(0).toUpperCase() + (signal || "").slice(1)}
                        </Span>{" "}
                        Signal
                    </Text>
                )}
                {isSignalStrengthLoading ? (
                    <Skeleton defaultSkeleton w={"100px"} h={{ base: "70px", sm: "85px" }} borderRadius={"25px"} />
                ) : (
                    <Text px={4} py={0} border={"5px solid"} borderRadius="25px" borderColor={`scoreColor.${signal}`}>
                        {signalValue}
                    </Text>
                )}
            </HStack>
            <VStack align="stretch" gap={1} pb={8} w={"100%"}>
                <HStack gap={0} h={"30px"} w={"100%"}>
                    {["Low", "Mid", "High"].map((level) => (
                        <Text
                            key={level}
                            fontSize="20px"
                            w={`${calculateSignalPercentageFromName(level)}%`}
                            textAlign="center"
                            fontWeight={signal === level ? "bold" : "normal"}
                            color={signal === level ? `scoreColor.${signal}` : "inherit"}
                        >
                            {level}
                        </Text>
                    ))}
                </HStack>
                {isSignalStrengthLoading ? (
                    <HStack
                        gap={3}
                        h={"40px"}
                        w={"100%"}
                        border={"3px solid"}
                        borderRadius={"10px"}
                        borderColor={"contentBorder"}
                        justifyContent={"center"}
                        className="rainbow-animation"
                    >
                        <Text fontWeight={"bold"} color="white" textAlign={"center"} fontSize={"md"}>
                            Update in progress...
                        </Text>
                        <Spinner />
                    </HStack>
                ) : (
                    <HStack
                        gap={0}
                        h={"40px"}
                        w={"100%"}
                        border={"3px solid"}
                        borderRadius={"10px"}
                        borderColor={"contentBorder"}
                        overflow={(signalValue || 0) < 20 ? "hidden" : "visible"}
                        position="relative"
                    >
                        <Box
                            position="relative"
                            w={`${signalValue}%`}
                            h={"100%"}
                            textAlign="center"
                            border={signalValue === 100 ? "2px solid" : "none"}
                            borderRight={signalValue === 100 ? "2px solid" : "3px solid"}
                            borderRightRadius={signalValue === 100 ? "md" : "none"}
                            borderColor={`scoreColor.${signal}`}
                            _before={{
                                content: '""',
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                bg: `scoreColor.${signal}`,
                                opacity: 0.3,
                                borderLeftRadius: "7px",
                            }}
                        />
                        <Box
                            position="absolute"
                            left={`${calculateSignalThresholdFromName("Low") - 0.5}%`}
                            top="0"
                            bottom="0"
                            borderLeft="3px dashed"
                            borderColor="contentBorder"
                        />
                        <Box
                            position="absolute"
                            left={`${calculateSignalThresholdFromName("High") - 0.5}%`}
                            top="0"
                            bottom="0"
                            borderLeft="3px dashed"
                            borderColor="contentBorder"
                        />
                    </HStack>
                )}
            </VStack>
        </VStack>
    )
}
