import { HStack, VStack, Box, Text } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronRight, faInfoCircle } from "@fortawesome/free-solid-svg-icons"
import { faLightbulb } from "@fortawesome/free-regular-svg-icons"
import { useState } from "react"

export default function SignalStrength({
    userData,
    projectData,
    isUserConnected,
}: {
    userData: SignalStrengthUserData
    projectData: SignalStrengthProjectData
    isUserConnected: boolean
}) {
    const percentageCompleted = (Number(userData.value) / Number(projectData.maxValue)) * 100
    const completedBarWidth = percentageCompleted > 100 ? "100%" : `${percentageCompleted}%`
    const [isOpen, setIsOpen] = useState(true)

    // Check if the box should be openable
    const hasContent = Boolean(userData.description || userData.improvements)

    return (
        <VStack alignItems={"center"} gap={4} w={"100%"} bg="gray.900" py={3} px={3} borderRadius={"16px"}>
            <HStack
                alignItems={"baseline"}
                py={2}
                px={4}
                justifyContent={"center"}
                border={"5px solid"}
                borderColor={"pageBackground"}
                borderRadius={"12px"}
                gap={3}
                w="100%"
            >
                <Text fontSize="xl">{projectData.displayName}</Text>
                {projectData.status === "active" && (
                    <HStack
                        gap={"2px"}
                        bg={completedBarWidth !== "0%" ? "green.500" : "gray.800"}
                        fontSize="xl"
                        px={2}
                        borderRadius="8px"
                        color={completedBarWidth !== "0%" ? "#029E03" : "gray.400"}
                    >
                        {completedBarWidth !== "0%" && <Text>+</Text>}
                        <Text>{userData.value}</Text>
                    </HStack>
                )}
            </HStack>
            <HStack
                w="100%"
                justifyContent={"space-between"}
                alignItems={"center"}
                fontSize={"lg"}
                color={"gray.400"}
                px={1}
            >
                <Text fontFamily={"monospace"}>0</Text>
                <HStack w="100%" h="30px" bg="gray.800" borderRadius="md" overflow="hidden">
                    {projectData.status === "active" && !isUserConnected ? (
                        <Text color="gray.400" w={"100%"} textAlign={"center"} fontSize={"md"}>
                            Account not connected
                        </Text>
                    ) : projectData.status === "dev" ? (
                        <HStack gap={3} color={"gray.400"} w={"100%"} justifyContent={"center"} fontSize={"md"}>
                            <Text>🏗️</Text>
                            <Text>Coming soon</Text>
                            <Text>🏗️</Text>
                        </HStack>
                    ) : (
                        <Box
                            w={completedBarWidth}
                            h="100%"
                            bg="green.500"
                            border={
                                completedBarWidth === "100%"
                                    ? "2px solid"
                                    : completedBarWidth === "0%"
                                      ? "none"
                                      : "none"
                            }
                            borderRight={
                                completedBarWidth === "100%"
                                    ? "2px solid"
                                    : completedBarWidth === "0%"
                                      ? "none"
                                      : "3px solid"
                            }
                            borderRadius={completedBarWidth === "100%" ? "md" : "none"}
                            borderColor="#029E03"
                        />
                    )}
                </HStack>
                <Text fontFamily={"monospace"}>{projectData.maxValue}</Text>
            </HStack>
            {isUserConnected && (
                <VStack w="100%" gap={0} alignItems={"start"}>
                    <HStack
                        alignItems={"center"}
                        justifyContent={"start"}
                        cursor={hasContent ? "pointer" : "default"}
                        py={2}
                        pl={3}
                        pr={4}
                        gap={3}
                        w={"100%"}
                        bg={"pageBackground"}
                        borderRadius={"10px"}
                        borderBottomRadius={hasContent ? (isOpen ? "none" : "10px") : "10px"}
                        onClick={hasContent ? () => setIsOpen(!isOpen) : undefined}
                        _hover={hasContent ? { bg: "gray.800" } : undefined}
                    >
                        {hasContent ? (
                            <Box transform={isOpen ? "rotate(90deg)" : "rotate(0deg)"} transition="transform 0.2s">
                                <FontAwesomeIcon icon={faChevronRight} />
                            </Box>
                        ) : (
                            <Box color="gray.400">
                                <FontAwesomeIcon icon={faInfoCircle} size="lg" />
                            </Box>
                        )}
                        <Text>{userData.summary ? userData.summary : "No summary available"}</Text>
                    </HStack>
                    {isOpen && hasContent && (
                        <VStack
                            w="100%"
                            gap={5}
                            px={4}
                            pt={2}
                            pb={3}
                            bg="pageBackground"
                            borderBottomRadius="md"
                            justifyContent={"start"}
                            alignItems={"start"}
                        >
                            {userData.description && (
                                <Text color="textColor">
                                    {userData.description?.charAt(0).toUpperCase() + userData.description?.slice(1)}
                                </Text>
                            )}
                            {userData.improvements && (
                                <VStack alignItems={"start"}>
                                    <HStack gap={2}>
                                        <FontAwesomeIcon icon={faLightbulb} size="lg" />
                                        <Text fontWeight={"bold"}>Suggestions on how to improve</Text>
                                    </HStack>
                                    <Text color="textColor">
                                        {userData.improvements.charAt(0).toUpperCase() + userData.improvements.slice(1)}
                                    </Text>
                                </VStack>
                            )}
                        </VStack>
                    )}
                </VStack>
            )}
            {projectData.status === "active" && !isUserConnected && (
                <HStack w={"100%"} justifyContent={"center"} cursor={"disabled"}>
                    <Text
                        color={"gray.900"}
                        justifyContent={"start"}
                        bg={"gray.300"}
                        borderRadius={"full"}
                        px={3}
                        py={1}
                    >
                        Connect your account (coming soon)
                    </Text>
                </HStack>
            )}
        </VStack>
    )
}
