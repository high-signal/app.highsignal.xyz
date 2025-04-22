import { HStack, VStack, Box, Text } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronRight, faInfoCircle } from "@fortawesome/free-solid-svg-icons"
import { faLightbulb } from "@fortawesome/free-regular-svg-icons"
import { useState, useEffect } from "react"

import { useUser } from "../../../contexts/UserContext"
import { useRouter } from "next/navigation"

import { keyframes } from "@emotion/react"

export default function SignalStrength({
    username,
    userData,
    projectData,
    isUserConnected,
    refreshUserData,
}: {
    username: string
    userData: SignalStrengthUserData
    projectData: SignalStrengthProjectData
    isUserConnected: boolean
    refreshUserData: () => void
}) {
    const { loggedInUser } = useUser()
    const router = useRouter()

    const percentageCompleted = (Number(userData.value) / Number(projectData.maxValue)) * 100
    const completedBarWidth = percentageCompleted > 100 ? "100%" : `${percentageCompleted}%`
    const [isOpen, setIsOpen] = useState(true)
    const [countdown, setCountdown] = useState<number | null>(null)
    const [triggerRefresh, setTriggerRefresh] = useState(false)
    const [countdownText, setCountdownText] = useState<string | null>("Analyzing engagement...")

    // Check if the box should be openable
    const hasContent = Boolean(userData.description || userData.improvements)

    const countdownDuration = 22000

    const rainbowAnimation = keyframes`
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
        `

    // Refresh user data before the end of the countdown
    useEffect(() => {
        refreshUserData()
    }, [triggerRefresh, refreshUserData])

    // Calculate countdown timer
    useEffect(() => {
        if (!userData.lastChecked) return

        const lastCheckedTime = userData.lastChecked * 1000
        const now = Date.now()
        const timeElapsed = now - lastCheckedTime
        const timeRemaining = countdownDuration - timeElapsed

        if (timeRemaining <= 0) {
            setCountdown(null)
            return
        }

        // Set initial countdown
        setCountdown(Math.ceil(timeRemaining / 1000))

        // Update countdown every second
        const timer = setInterval(() => {
            const updatedNow = Date.now()
            const updatedTimeElapsed = updatedNow - lastCheckedTime
            const updatedTimeRemaining = countdownDuration - updatedTimeElapsed

            if (updatedTimeRemaining > countdownDuration * 0.6) {
                setCountdownText("Analyzing engagement...")
            } else if (updatedTimeRemaining > countdownDuration * 0.3) {
                setCountdownText("Checking criteria...")
            } else if (updatedTimeRemaining > countdownDuration * 0.15) {
                setCountdownText("Calculating score...")
            }

            if (updatedTimeRemaining < 1000) {
                setTriggerRefresh(true)
            }

            if (updatedTimeRemaining <= 0) {
                setCountdown(null)
                clearInterval(timer)
            } else {
                setCountdown(Math.ceil(updatedTimeRemaining / 1000))
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [userData.lastChecked])

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
                {!countdown && projectData.status === "active" && (
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
                <HStack
                    w="100%"
                    h="30px"
                    bg="gray.800"
                    borderRadius="md"
                    overflow="hidden"
                    backgroundImage={
                        countdown ? "linear-gradient(270deg, pink, purple, blue, red, blue, purple, pink)" : "none"
                    }
                    backgroundSize={countdown ? "1000% 1000%" : "none"}
                    textShadow={countdown ? "0px 0px 5px black" : "none"}
                    animation={countdown ? `${rainbowAnimation} 20s linear infinite` : "none"}
                >
                    {countdown !== null ? (
                        <Text fontWeight={"bold"} color="white" w={"100%"} textAlign={"center"} fontSize={"md"}>
                            {countdownText}{" "}
                            <Text as="span" fontFamily={"monospace"}>
                                {countdown}
                            </Text>
                            s
                        </Text>
                    ) : projectData.status === "active" && !isUserConnected ? (
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
            {isUserConnected && !countdown && (
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
            {projectData.status === "active" && !isUserConnected && loggedInUser?.username === username && (
                <HStack w={"100%"} justifyContent={"center"} cursor={"disabled"}>
                    <Text
                        justifyContent={"start"}
                        bg="orange.500"
                        _hover={{ bg: "orange.600" }}
                        fontWeight={"bold"}
                        fontSize={"sm"}
                        borderRadius={"full"}
                        px={3}
                        py={1}
                        cursor={"pointer"}
                        onClick={() => {
                            router.push(`/settings/u/${username}`)
                        }}
                    >
                        Connect your account
                    </Text>
                </HStack>
            )}
        </VStack>
    )
}
