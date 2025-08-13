import { VStack, HStack, Text } from "@chakra-ui/react"
import { useUser } from "../../contexts/UserContext"

export default function SignalScoreDescription({
    currentUser,
    projectData,
}: {
    currentUser: UserData
    projectData: ProjectData
}) {
    const { loggedInUser } = useUser()

    let titleText = ""
    let descriptionText = ""
    let titleEmoji = ""

    if (currentUser.score === 100) {
        titleEmoji = "💯"
        titleText = `${loggedInUser?.username === currentUser.username ? "You have" : `${currentUser.displayName} has`} reached the maximum Signal Score for ${projectData.displayName}`
        descriptionText = `Keep engaging with ${projectData.displayName} to maintain this perfect Signal Score!`
    } else if (currentUser.signal === "high") {
        titleEmoji = "🤩"
        titleText = `${loggedInUser?.username === currentUser.username ? "You are" : `${currentUser.displayName} is`} ${currentUser.signal.slice(0, 1).toUpperCase() + currentUser.signal.slice(1)} Signal for ${projectData.displayName}`
        descriptionText = `Add more accounts and keep engaging with ${projectData.displayName} to max out your Signal Score!`
    } else if (currentUser.signal === "mid") {
        titleEmoji = "🙂"
        titleText = `${loggedInUser?.username === currentUser.username ? "You are" : `${currentUser.displayName} is`} ${currentUser.signal.slice(0, 1).toUpperCase() + currentUser.signal.slice(1)} Signal for ${projectData.displayName}`
        descriptionText = `Add accounts and engage more consistently with ${projectData.displayName} to get a High Signal Score.`
    } else if (currentUser.signal === "low") {
        titleEmoji = "😕"
        titleText = `${loggedInUser?.username === currentUser.username ? "You are" : `${currentUser.displayName} is`} ${currentUser.signal.slice(0, 1).toUpperCase() + currentUser.signal.slice(1)} Signal for ${projectData.displayName}`
        descriptionText = `Add more accounts and engage more frequently with ${projectData.displayName} to get a higher Signal Score.`
    }

    return (
        <VStack bg={"contentBackground"} p={4} borderRadius={"16px"} w={"fit-content"} textAlign={"center"}>
            <HStack fontWeight={"bold"} gap={3}>
                <Text>{titleEmoji}</Text>
                <Text>{titleText}</Text>
                <Text>{titleEmoji}</Text>
            </HStack>
            <Text>{descriptionText}</Text>
        </VStack>
    )
}
