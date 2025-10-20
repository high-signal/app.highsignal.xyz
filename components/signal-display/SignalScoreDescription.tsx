import { useEffect, useState } from "react"
import { VStack, HStack, Text } from "@chakra-ui/react"
import { useUser } from "../../contexts/UserContext"

import { APP_CONFIG } from "../../config/constants"

export default function SignalScoreDescription({
    currentUser,
    projectData,
    isSignalStrengthLoading,
}: {
    currentUser: UserData
    projectData: ProjectData
    isSignalStrengthLoading: number | null
}) {
    const { loggedInUser } = useUser()
    const [showLoading, setShowLoading] = useState(false)

    useEffect(() => {
        if (isSignalStrengthLoading) {
            const timeElapsed = Number((Date.now() / 1000).toFixed(0)) - isSignalStrengthLoading

            // Simply multiply the duration by 2 to give a buffer
            const remainingTime = (2 * APP_CONFIG.SIGNAL_STRENGTH_LOADING_DURATION) / 1000 - timeElapsed

            if (remainingTime > 0) {
                const timer = setTimeout(() => setShowLoading(true), remainingTime * 1000)
                return () => clearTimeout(timer)
            } else {
                setShowLoading(true)
            }
        }
    }, [isSignalStrengthLoading])

    let titleText = ""
    let descriptionText = ""
    let titleEmoji = ""

    if (isSignalStrengthLoading && !showLoading) {
        return null
    }

    if (showLoading) {
        descriptionText = `⏳ Check back later to see ${loggedInUser?.username === currentUser.username ? "your" : "the"} calculated score ⏳`
    } else if (!isSignalStrengthLoading) {
        if (currentUser.score === 100) {
            titleEmoji = "💯"
            titleText = `${loggedInUser?.username === currentUser.username ? "You have" : `${currentUser.displayName} has`} reached the maximum Signal Score for ${projectData.displayName}`
            // descriptionText = `Keep engaging with ${projectData.displayName} to maintain this perfect Signal Score!`
        } else if (currentUser.signal === "high") {
            titleEmoji = "🤩"
            titleText = `${loggedInUser?.username === currentUser.username ? "You are" : `${currentUser.displayName} is`} ${currentUser.signal.slice(0, 1).toUpperCase() + currentUser.signal.slice(1)} Signal for ${projectData.displayName}`
            // descriptionText = `Add more accounts and keep engaging with ${projectData.displayName} to max out your Signal Score!`
        } else if (currentUser.signal === "mid") {
            titleEmoji = "🙂"
            titleText = `${loggedInUser?.username === currentUser.username ? "You are" : `${currentUser.displayName} is`} ${currentUser.signal.slice(0, 1).toUpperCase() + currentUser.signal.slice(1)} Signal for ${projectData.displayName}`
            // descriptionText = `Add accounts and engage more consistently with ${projectData.displayName} to get a High Signal Score.`
        } else if (currentUser.signal === "low") {
            titleEmoji = "😕"
            titleText = `${loggedInUser?.username === currentUser.username ? "You are" : `${currentUser.displayName} is`} ${currentUser.signal.slice(0, 1).toUpperCase() + currentUser.signal.slice(1)} Signal for ${projectData.displayName}`
            // descriptionText = `Add more accounts and engage more frequently with ${projectData.displayName} to get a higher Signal Score.`
        }
    }

    if (!titleText && !descriptionText) {
        return null
    }

    return (
        <VStack bg={"contentBackground"} p={4} borderRadius={"16px"} w={"fit-content"} textAlign={"center"}>
            {titleText && (
                <HStack fontWeight={"bold"} gap={3} alignItems={"start"}>
                    <Text>{titleEmoji}</Text>
                    <Text>{titleText}</Text>
                    <Text>{titleEmoji}</Text>
                </HStack>
            )}
            {descriptionText && <Text>{descriptionText}</Text>}
        </VStack>
    )
}
