"use client"

import { VStack, Text, Box } from "@chakra-ui/react"
import PeakSignalsContainer from "./peak-signals/PeakSignalsContainer"
import operatorData from "/public/data/userData.json"
import CurrentSignal from "./CurrentSignal"
import SignalStrengthContainer from "./SignalStrengthContainer"
import UserInfo from "./UserInfo"
import Title from "./Title"

export default function SignalDisplayContainer({ username }: { username: string }) {
    const data = operatorData[username as keyof typeof operatorData]
    if (!data) return <Text>{username} not found</Text>

    return (
        <Box w="100%" maxW="600px" borderRadius="20px" p={6} zIndex={10}>
            <VStack align="stretch" gap={3}>
                <VStack justify="center" gap={6} w={"100%"} alignItems="center" wrap={"wrap"}>
                    {/* Signal Display Title */}
                    <Title />

                    {/* User Info */}
                    <UserInfo
                        operatorImage={data.operatorImage}
                        operatorNumber={data.operatorNumber}
                        name={data.name}
                    />
                </VStack>
                <CurrentSignal signal={data.signal} signalValue={data.signalValue} signalColor={data.signalColor} />
                <PeakSignalsContainer peakSignals={data.peakSignals} />
                <SignalStrengthContainer metrics={data.metrics} />
            </VStack>
        </Box>
    )
}
