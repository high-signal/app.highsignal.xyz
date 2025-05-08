import { HStack, Text } from "@chakra-ui/react"
import SingleLineTextInput from "../ui/SingleLineTextInput"
import { Switch } from "@chakra-ui/react"

interface SignalStrengthConfigProps {
    signalStrength: SignalStrengthProjectData
}

export default function SignalStrengthConfig({ signalStrength }: SignalStrengthConfigProps) {
    return (
        <>
            {signalStrength.status !== "dev" && signalStrength.enabled ? (
                <HStack justifyContent="start" w="100px">
                    <SingleLineTextInput
                        value={signalStrength.maxValue.toString()}
                        onChange={() => {}}
                        onKeyDown={() => {}}
                        isEditable={true}
                    />
                    <Text whiteSpace="nowrap">/ 100</Text>
                </HStack>
            ) : (
                <Text>Coming soon 🏗️</Text>
            )}
            <Switch.Root
                defaultChecked={signalStrength.status === "active" && signalStrength.enabled}
                disabled={signalStrength.status != "active"}
            >
                <Switch.HiddenInput />
                <Switch.Control>
                    <Switch.Thumb />
                </Switch.Control>
                <Switch.Label />
            </Switch.Root>
        </>
    )
}
