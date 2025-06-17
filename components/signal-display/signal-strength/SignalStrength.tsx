import { HStack, VStack, Box, Text, Spinner, Button } from "@chakra-ui/react"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronRight, faInfoCircle } from "@fortawesome/free-solid-svg-icons"
import { faLightbulb } from "@fortawesome/free-regular-svg-icons"
import { useState, useEffect } from "react"

import { useUser } from "../../../contexts/UserContext"

import { APP_CONFIG } from "../../../config/constants"

const SignalStrengthLozenge = ({ children }: { children: React.ReactNode }) => (
    <HStack flexGrow={1} justifyContent={{ base: "center", sm: "end" }}>
        <HStack
            gap={2}
            px={3}
            py={1}
            bg={"pageBackground"}
            borderRadius={"full"}
            color={"textColorMuted"}
            cursor={"default"}
        >
            {children}
        </HStack>
    </HStack>
)

export default function SignalStrength({
    username,
    userData,
    projectData,
    signalStrengthProjectData,
    isUserConnected,
    refreshUserData,
}: {
    username: string
    userData: SignalStrengthUserData
    projectData: ProjectData
    signalStrengthProjectData: SignalStrengthProjectData
    isUserConnected: boolean
    refreshUserData: () => void
}) {
    const { loggedInUser } = useUser()

    const displayValue = userData.value || userData.rawValue || 0

    const percentageCompleted = (Number(displayValue) / Number(signalStrengthProjectData.maxValue)) * 100
    const completedBarWidth = percentageCompleted > 100 ? "100%" : `${percentageCompleted}%`
    const [isOpen, setIsOpen] = useState(true)
    const [countdown, setCountdown] = useState<number | null>(null)
    const [countdownText, setCountdownText] = useState<string | null>("Analyzing engagement...")
    const [userDataRefreshTriggered, setUserDataRefreshTriggered] = useState(false)

    // Check if the box should be openable
    const hasContent = Boolean(userData.description || userData.improvements)

    const countdownDuration = APP_CONFIG.SIGNAL_STRENGTH_LOADING_DURATION

    useEffect(() => {
        if (userDataRefreshTriggered) {
            // Add small delay so the spinner is visible
            setTimeout(() => {
                setUserDataRefreshTriggered(false)
            }, 2000)
        }
    }, [userDataRefreshTriggered, userData])

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

            if (updatedTimeRemaining <= 0) {
                refreshUserData()
                setCountdown(null)
                clearInterval(timer)
                setUserDataRefreshTriggered(true)
            } else {
                setCountdown(Math.ceil(updatedTimeRemaining / 1000))
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [userData.lastChecked, countdownDuration, refreshUserData])

    // Scroll to the project name when the element is loaded if the hash matches the project name
    useEffect(() => {
        // Check if the current hash matches this project's name
        if (window.location.hash === `#${signalStrengthProjectData.name}`) {
            // Small delay to ensure the element is rendered
            setTimeout(() => {
                const element = document.getElementById(signalStrengthProjectData.name)
                if (element) {
                    element.scrollIntoView({ behavior: "smooth" })
                }
            }, 100)
        }
    }, [signalStrengthProjectData.name])

    return (
        <VStack
            alignItems={"center"}
            gap={4}
            w={"100%"}
            maxW={"600px"}
            bg="contentBackground"
            py={3}
            px={3}
            borderRadius={{ base: 0, sm: "16px" }}
        >
            <HStack
                alignItems={userDataRefreshTriggered ? "center" : "baseline"}
                py={2}
                px={4}
                justifyContent={{ base: "center", md: !signalStrengthProjectData.enabled ? "start" : "center" }}
                border={"5px solid"}
                borderColor={"pageBackground"}
                borderRadius={"12px"}
                columnGap={3}
                rowGap={1}
                w="100%"
                flexWrap={"wrap"}
            >
                <Text
                    as="a"
                    id={signalStrengthProjectData.name}
                    fontSize="xl"
                    color={!signalStrengthProjectData.enabled ? "textColorMuted" : undefined}
                >
                    {signalStrengthProjectData.displayName}
                </Text>
                {!countdown &&
                    !userDataRefreshTriggered &&
                    signalStrengthProjectData.status === "active" &&
                    signalStrengthProjectData.enabled && (
                        <HStack
                            gap={"2px"}
                            bg={
                                completedBarWidth !== "0%" ? "lozenge.background.active" : "lozenge.background.disabled"
                            }
                            fontSize="xl"
                            px={2}
                            borderRadius="8px"
                            color={completedBarWidth !== "0%" ? "lozenge.text.active" : "lozenge.text.disabled"}
                        >
                            {completedBarWidth !== "0%" && <Text>+</Text>}
                            <Text>{displayValue}</Text>
                        </HStack>
                    )}
                {signalStrengthProjectData.status === "dev" && (
                    <SignalStrengthLozenge>
                        <Text>🏗️</Text>
                        <Text>Coming soon</Text>
                        <Text>🏗️</Text>
                    </SignalStrengthLozenge>
                )}
                {signalStrengthProjectData.status === "active" && !signalStrengthProjectData.enabled && (
                    <SignalStrengthLozenge>
                        <Text>Not enabled by {projectData.displayName}</Text>
                    </SignalStrengthLozenge>
                )}
            </HStack>
            {signalStrengthProjectData.status !== "dev" && signalStrengthProjectData.enabled && (
                <HStack
                    w="100%"
                    justifyContent={"space-between"}
                    alignItems={"center"}
                    fontSize={"lg"}
                    color={"textColorMuted"}
                    px={1}
                >
                    <Text fontFamily={"monospace"}>0</Text>
                    <HStack
                        w="100%"
                        h="30px"
                        bg="lozenge.background.disabled"
                        borderRadius="md"
                        overflow="hidden"
                        className={userDataRefreshTriggered || countdown ? "rainbow-animation" : ""}
                        border="3px solid"
                        borderColor={completedBarWidth === "100%" ? "lozenge.border.active" : "pageBackground"}
                    >
                        {userDataRefreshTriggered ? (
                            <HStack w={"100%"} justifyContent={"center"}>
                                <Text fontWeight={"bold"} color="white" textAlign={"center"} fontSize={"md"}>
                                    Loading score...
                                </Text>
                                <Spinner size="sm" />
                            </HStack>
                        ) : countdown !== null ? (
                            <Text fontWeight={"bold"} color="white" w={"100%"} textAlign={"center"} fontSize={"md"}>
                                {countdownText}{" "}
                                <Text as="span" fontFamily={"monospace"}>
                                    {countdown}
                                </Text>
                                s
                            </Text>
                        ) : signalStrengthProjectData.status === "active" && !isUserConnected ? (
                            <Text color={"lozenge.text.disabled"} w={"100%"} textAlign={"center"} fontSize={"md"}>
                                Account not connected
                            </Text>
                        ) : (
                            <Box
                                w={completedBarWidth}
                                h="100%"
                                bg="lozenge.background.active"
                                borderRight={
                                    completedBarWidth === "100%" || completedBarWidth === "0%" ? "none" : "3px solid"
                                }
                                borderColor={"lozenge.border.active"}
                            />
                        )}
                    </HStack>
                    <Text fontFamily={"monospace"}>{signalStrengthProjectData.maxValue}</Text>
                </HStack>
            )}
            {isUserConnected && !countdown && !userDataRefreshTriggered && (
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
                        _hover={hasContent ? { bg: "button.contentButton.default" } : undefined}
                    >
                        {hasContent ? (
                            <Box transform={isOpen ? "rotate(90deg)" : "rotate(0deg)"} transition="transform 0.2s">
                                <FontAwesomeIcon icon={faChevronRight} />
                            </Box>
                        ) : (
                            <Box color="textColorMuted">
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
                                <Text color="textColorMuted">
                                    {userData.description?.charAt(0).toUpperCase() + userData.description?.slice(1)}
                                </Text>
                            )}
                            {userData.improvements && (
                                <VStack alignItems={"start"}>
                                    <HStack columnGap={5} rowGap={2} flexWrap={"wrap"}>
                                        <HStack gap={2}>
                                            <FontAwesomeIcon icon={faLightbulb} size="lg" />
                                            <Text>How to improve your score</Text>
                                        </HStack>
                                        <HStack flexGrow={1} justifyContent={"center"}>
                                            <HStack
                                                bg={"contentBackground"}
                                                borderRadius={"full"}
                                                px={3}
                                                py={1}
                                                fontSize={"sm"}
                                                gap={3}
                                                cursor={"default"}
                                                color={"textColorMuted"}
                                            >
                                                <Text>🏗️</Text>
                                                <Text>Coming soon</Text>
                                                <Text>🏗️</Text>
                                            </HStack>
                                        </HStack>
                                    </HStack>
                                    {/* TODO: Add improvements when they are better*/}
                                    {/* <Text color="textColorMuted">
                                        {userData.improvements.charAt(0).toUpperCase() + userData.improvements.slice(1)}
                                    </Text> */}
                                </VStack>
                            )}
                        </VStack>
                    )}
                </VStack>
            )}
            {signalStrengthProjectData.status === "active" &&
                !isUserConnected &&
                loggedInUser?.username === username && (
                    <HStack w={"100%"} justifyContent={"center"} cursor={"disabled"}>
                        <Link href={`/settings/u/${username}?tab=connected-accounts`}>
                            <Button
                                primaryButton
                                justifyContent={"start"}
                                fontWeight={"bold"}
                                fontSize={"sm"}
                                borderRadius={"full"}
                                px={3}
                                py={1}
                            >
                                Connect your account
                            </Button>
                        </Link>
                    </HStack>
                )}
        </VStack>
    )
}
