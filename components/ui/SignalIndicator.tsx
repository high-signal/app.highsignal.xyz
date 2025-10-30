import { Button, HStack, Text } from "@chakra-ui/react"
import { faExternalLink } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

export default function SignalIndicator({
    signalName,
    icon,
    text,
    project,
    button,
}: {
    signalName: string
    icon: any
    text: string
    project: ProjectData
    button?: boolean
}) {
    const isEnabled = project.signalStrengths.find((signal) => signal.name === signalName)?.enabled ?? false

    const Content = () => {
        return (
            <>
                <FontAwesomeIcon icon={icon} size="sm" />
                <Text>{text}</Text>
                {button && <FontAwesomeIcon icon={faExternalLink} size="sm" />}
            </>
        )
    }

    if (button) {
        return (
            <Button
                secondaryButton
                h={"100%"}
                py={1}
                px={3}
                borderRadius="full"
                fontSize="md"
                disabled={!isEnabled}
                cursor={isEnabled ? "pointer" : "default"}
                onClick={
                    button && isEnabled
                        ? () =>
                              window.open(
                                  project.signalStrengths.find((signal) => signal.name === signalName)?.url,
                                  "_blank",
                              )
                        : undefined
                }
            >
                <Content />
            </Button>
        )
    }

    return (
        <HStack
            h={"30px"}
            py={1}
            px={2}
            borderRadius="full"
            border="2px solid"
            borderColor="contentBorder"
            bg={"pageBackground"}
            gap={"6px"}
            opacity={isEnabled ? "1" : "0.2"}
            cursor={button ? (isEnabled ? "pointer" : "default") : "pointer"}
        >
            <Content />
        </HStack>
    )
}
