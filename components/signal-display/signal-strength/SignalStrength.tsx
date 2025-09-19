"use client"

import { HStack, VStack, Box, Text, Spinner, Button } from "@chakra-ui/react"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronRight, faInfoCircle } from "@fortawesome/free-solid-svg-icons"
import { faLightbulb } from "@fortawesome/free-regular-svg-icons"
import { faDiscord, faXTwitter, faDiscourse } from "@fortawesome/free-brands-svg-icons"
import { useState, useEffect } from "react"

import HistoricalDataChart from "./HistoricalDataChart"

import { useUser } from "../../../contexts/UserContext"

import LoginToSeeInsights from "../../ui/LoginToSeeInsights"
import { APP_CONFIG } from "../../../config/constants"
import Divider from "../../ui/Divider"

// Define signalStrengthIcons
const signalStrengthIcons = {
    discourse_forum: faDiscourse,
    discord: faDiscord,
    x_twitter: faXTwitter,
} as const
type SignalStrengthName = keyof typeof signalStrengthIcons

const SignalStrengthLozenge = ({ children }: { children: React.ReactNode }) => (
    <HStack flexGrow={1} justifyContent={{ base: "center", sm: "end" }}>
        <HStack
            gap={2}
            px={3}
            py={1}
            bg={"pageBackground"}
            borderRadius={"full"}
            cursor={"default"}
            fontWeight={"semibold"}
            color={"teal.500"}
            fontSize={"sm"}
        >
            {children}
        </HStack>
    </HStack>
)

const ShowMoreDetailsButton = () => (
    <Button
        as={"span"}
        secondaryButton
        borderRadius={"full"}
        opacity={0.9}
        minW={"45px"}
        maxW={"45px"}
        w={"45px"}
        ml={2}
        mb={"1px"}
        py={"2px"}
        gap={0}
        pr={"2px"}
    >
        <FontAwesomeIcon icon={faChevronRight} />
        <FontAwesomeIcon icon={faInfoCircle} size="lg" />
    </Button>
)

export default function SignalStrength({
    username,
    userData,
    dailyData,
    timestamp,
    projectData,
    signalStrengthProjectData,
    refreshUserData,
}: {
    username: string
    userData: SignalStrengthUserData
    dailyData?: SignalStrengthUserData[]
    timestamp: number
    projectData: ProjectData
    signalStrengthProjectData: SignalStrengthProjectData
    refreshUserData: () => void
}) {
    const { loggedInUser } = useUser()

    const displayValue = userData.value || userData.rawValue || 0

    const percentageCompleted = (Number(displayValue) / Number(signalStrengthProjectData.maxValue)) * 100
    const completedBarWidth = percentageCompleted > 100 ? "100%" : `${percentageCompleted}%`
    const [isOpen, setIsOpen] = useState(userData.description ? true : false)
    const [countdown, setCountdown] = useState<number | null>(null)
    const [countdownText, setCountdownText] = useState<string | null>("Analyzing activity...")
    const [userDataRefreshTriggered, setUserDataRefreshTriggered] = useState(false)

    const countdownDuration = APP_CONFIG.SIGNAL_STRENGTH_LOADING_DURATION

    const expandableContent =
        userData && (Number(userData.value || 0) > 0 || !userData.summary?.includes("No activity in the past"))

    const userContentAvailable =
        userData &&
        (userData.lastChecked ||
            Number(userData.value || 0) > 0 ||
            Number(userData.rawValue || 0) > 0 ||
            userData.summary?.includes("No activity in the past"))
            ? true
            : false

    // When timestamp changes, stop the spinner
    useEffect(() => {
        // Add small delay so the spinner is visible
        setTimeout(() => {
            setUserDataRefreshTriggered(false)
        }, 2000)
    }, [timestamp])

    // Calculate countdown timer
    useEffect(() => {
        if (!userData.lastChecked) {
            setCountdown(null)
            return
        }

        const lastCheckedTime = userData.lastChecked * 1000
        const now = Date.now()
        const timeElapsed = now - lastCheckedTime
        const timeRemaining = countdownDuration - timeElapsed

        if (timeRemaining <= 0) {
            setCountdown(-2)
            setCountdownText("Calculating score...")
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
                setCountdownText("Analyzing activity...")
            } else if (updatedTimeRemaining > countdownDuration * 0.3) {
                setCountdownText("Checking criteria...")
            } else if (updatedTimeRemaining > countdownDuration * 0.15) {
                setCountdownText("Calculating score...")
            }

            // Set countdown to -1 when the countdown is complete
            // and trigger a refresh of the user data
            if (updatedTimeRemaining <= 0) {
                refreshUserData()
                setCountdown(-1)
                clearInterval(timer)
                setUserDataRefreshTriggered(true)
            } else {
                setCountdown(Math.ceil(updatedTimeRemaining / 1000))
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [userData.lastChecked, countdownDuration, refreshUserData, timestamp])

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

    // Get the icon based on signalStrengthProjectData.name
    const icon = signalStrengthIcons[signalStrengthProjectData.name as SignalStrengthName]

    const dataAvailable =
        signalStrengthProjectData.enabled && userContentAvailable && !countdown && !userDataRefreshTriggered

    return (
        <VStack
            alignItems={"center"}
            gap={6}
            w={"100%"}
            maxW={"600px"}
            bg="contentBackground"
            py={3}
            px={3}
            borderRadius={{ base: 0, sm: "16px" }}
        >
            <VStack
                alignItems={"center"}
                py={2}
                px={2}
                border={"5px solid"}
                borderColor={"pageBackground"}
                borderRadius={"12px"}
            >
                <HStack
                    justifyContent={{
                        base: "center",
                        sm: !signalStrengthProjectData.enabled ? "space-between" : "center",
                    }}
                    columnGap={3}
                    rowGap={2}
                    w="100%"
                    flexWrap={"wrap"}
                >
                    <HStack gap={3} alignItems={"center"} justifyContent={"center"} w={{ base: "100%", sm: "auto" }}>
                        {icon && <FontAwesomeIcon icon={icon} size="lg" />}
                        <Text
                            as="a"
                            id={signalStrengthProjectData.name}
                            fontSize="xl"
                            color={!signalStrengthProjectData.enabled ? "textColorMuted" : undefined}
                        >
                            {signalStrengthProjectData.displayName}
                        </Text>
                    </HStack>
                    {!countdown &&
                        !userDataRefreshTriggered &&
                        signalStrengthProjectData.status === "active" &&
                        signalStrengthProjectData.enabled && (
                            <HStack>
                                <HStack
                                    gap={"2px"}
                                    bg={
                                        completedBarWidth !== "0%"
                                            ? "lozenge.background.active"
                                            : "lozenge.background.disabled"
                                    }
                                    fontSize="xl"
                                    px={2}
                                    borderRadius="8px"
                                    color={completedBarWidth !== "0%" ? "lozenge.text.active" : "lozenge.text.disabled"}
                                    cursor={"default"}
                                >
                                    {completedBarWidth !== "0%" && <Text>+</Text>}
                                    <Text>{displayValue}</Text>
                                </HStack>
                            </HStack>
                        )}
                    {signalStrengthProjectData.status === "dev" && (
                        <HStack w={{ base: "100%", sm: "auto" }} justifyContent={"space-between"}>
                            <SignalStrengthLozenge>
                                <Text>🏗️</Text>
                                <Text>Coming soon</Text>
                                <Text>🏗️</Text>
                            </SignalStrengthLozenge>
                        </HStack>
                    )}
                    {signalStrengthProjectData.status === "active" && !signalStrengthProjectData.enabled && (
                        <HStack w={{ base: "100%", sm: "auto" }} justifyContent={"space-between"}>
                            <SignalStrengthLozenge>
                                <Text>Not enabled by {projectData.displayName}</Text>
                            </SignalStrengthLozenge>
                        </HStack>
                    )}
                </HStack>
                {userContentAvailable &&
                    signalStrengthProjectData.status !== "dev" &&
                    signalStrengthProjectData.enabled && (
                        <VStack w="100%" gap={2} alignItems={"start"}>
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
                                    borderColor={
                                        completedBarWidth === "100%" ? "lozenge.border.active" : "pageBackground"
                                    }
                                >
                                    {userDataRefreshTriggered ? (
                                        <HStack w={"100%"} justifyContent={"center"}>
                                            <Text
                                                fontWeight={"bold"}
                                                color="white"
                                                textAlign={"center"}
                                                fontSize={"md"}
                                            >
                                                Loading score...
                                            </Text>
                                            <Spinner size="sm" />
                                        </HStack>
                                    ) : countdown !== null ? (
                                        <Text
                                            fontWeight={"bold"}
                                            color="white"
                                            w={"100%"}
                                            textAlign={"center"}
                                            fontSize={"md"}
                                        >
                                            {countdownText}{" "}
                                            {countdown > 0 && (
                                                <>
                                                    <Text as="span" fontFamily={"monospace"}>
                                                        {countdown}
                                                    </Text>
                                                    <Text as="span" fontFamily={"monospace"}>
                                                        s
                                                    </Text>
                                                </>
                                            )}
                                        </Text>
                                    ) : (
                                        <Box
                                            w={completedBarWidth}
                                            h="100%"
                                            bg="lozenge.background.active"
                                            borderRight={
                                                completedBarWidth === "100%" || completedBarWidth === "0%"
                                                    ? "none"
                                                    : "3px solid"
                                            }
                                            borderColor={"lozenge.border.active"}
                                        />
                                    )}
                                </HStack>
                                <Text fontFamily={"monospace"}>{signalStrengthProjectData.maxValue}</Text>
                            </HStack>
                            <Text w="100%" textAlign={"center"} color={"textColorMuted"} fontSize={"sm"} px={3}>
                                Your score is calculated based on your activity and engagement with the{" "}
                                {projectData.displayName} community over the past 360 days. <ShowMoreDetailsButton />
                            </Text>
                        </VStack>
                    )}
            </VStack>
            {dataAvailable && <Divider />}
            {dataAvailable && (
                <VStack w="100%" gap={0} alignItems={"center"}>
                    <Text fontWeight={"bold"} cursor={"default"} mb={2}>
                        {signalStrengthProjectData.displayName.split(" ").slice(0, -1).join(" ")} Activity Summary
                    </Text>
                    <Text w="100%" textAlign={"center"} color={"textColorMuted"} fontSize={"sm"} px={3} mb={2}>
                        This summary... {projectData.displayName}{" "}
                        {signalStrengthProjectData.displayName.split(" ").slice(0, -1).join(" ")} over the past{" "}
                        {signalStrengthProjectData.previousDays} days. <ShowMoreDetailsButton />
                    </Text>
                    <HStack
                        alignItems={"center"}
                        justifyContent={"start"}
                        cursor={expandableContent ? "pointer" : "default"}
                        py={2}
                        pl={3}
                        pr={4}
                        gap={3}
                        w={"100%"}
                        bg={"pageBackground"}
                        borderRadius={"10px"}
                        borderBottomRadius={expandableContent ? (isOpen ? "none" : "10px") : "10px"}
                        onClick={expandableContent ? () => setIsOpen(!isOpen) : undefined}
                        _hover={expandableContent ? { bg: "button.secondary.default" } : undefined}
                    >
                        {userData.summary && userData.summary.includes("No activity in the past") ? (
                            <Box color="textColorMuted">
                                <FontAwesomeIcon icon={faInfoCircle} size="lg" />
                            </Box>
                        ) : (
                            <Box transform={isOpen ? "rotate(90deg)" : "rotate(0deg)"} transition="transform 0.2s">
                                <FontAwesomeIcon icon={faChevronRight} />
                            </Box>
                        )}
                        {userData.summary && <Text>{userData.summary}</Text>}
                    </HStack>
                    {isOpen && expandableContent && (
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
                            {userData.description ? (
                                <Text color="textColorMuted">
                                    {userData.description?.charAt(0).toUpperCase() + userData.description?.slice(1)}
                                </Text>
                            ) : (
                                <HStack position={"relative"} w={"100%"} justifyContent={"center"}>
                                    <LoginToSeeInsights projectData={projectData} />
                                    <Text
                                        filter={"blur(5px)"}
                                        cursor={"default"}
                                        pointerEvents={"none"}
                                        userSelect={"none"}
                                    >
                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce accumsan leo
                                        vitae lectus aliquam congue. Mauris suscipit enim vel euismod lobortis. Aenean
                                        quis ultricies sapien. Fusce egestas in dolor vitae tempor. Phasellus euismod,
                                        est a fermentum ullamcorper, diam arcu molestie nisl.
                                    </Text>
                                </HStack>
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
                                                fontWeight={"semibold"}
                                                color={"teal.500"}
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
            {!userDataRefreshTriggered && countdown === -2 && (
                <VStack w="100%" gap={2} px={2} pb={3} textAlign={"center"} color="textColorMuted">
                    {loggedInUser?.username === username && (
                        <Text>
                            {`It's taking longer than expected to calculate your score, probably because you have a lot of
                        activity!`}
                        </Text>
                    )}
                    <Text>
                        Check back later to see {loggedInUser?.username === username ? "your" : "the"} updated score.
                    </Text>
                </VStack>
            )}
            {dataAvailable && <Divider />}
            {dataAvailable && dailyData && (
                <VStack w="100%" gap={2} alignItems={"start"} mb={2}>
                    <Text w="100%" fontWeight={"bold"} textAlign={"center"}>
                        {signalStrengthProjectData.displayName.split(" ").slice(0, -1).join(" ")} Daily Activity Tracker
                    </Text>
                    <Text w="100%" textAlign={"center"} color={"textColorMuted"} fontSize={"sm"} px={3}>
                        This chart shows your daily engagement scores for each day you have been active in the{" "}
                        {projectData.displayName}{" "}
                        {signalStrengthProjectData.displayName.split(" ").slice(0, -1).join(" ")} over the past{" "}
                        {signalStrengthProjectData.previousDays} days. <ShowMoreDetailsButton />
                    </Text>
                    <HistoricalDataChart
                        data={dailyData}
                        signalStrengthProjectData={signalStrengthProjectData}
                        projectData={projectData}
                    />
                </VStack>
            )}
            {signalStrengthProjectData.status === "active" &&
                signalStrengthProjectData.enabled &&
                !userContentAvailable &&
                loggedInUser?.username === username && (
                    <VStack w={"100%"} gap={2} alignItems={"center"}>
                        <Text textAlign={"center"} fontSize={"sm"} color={"textColorMuted"}>
                            Confirm ownership of this account so it can be used to calculate your score.
                        </Text>
                        <HStack w={"100%"} justifyContent={"center"}>
                            <Link href={`/settings/u/${username}?tab=accounts`}>
                                <Button
                                    primaryButton
                                    justifyContent={"start"}
                                    fontWeight={"bold"}
                                    fontSize={"sm"}
                                    borderRadius={"full"}
                                    px={3}
                                    py={1}
                                >
                                    Confirm ownership
                                </Button>
                            </Link>
                        </HStack>
                    </VStack>
                )}
        </VStack>
    )
}
