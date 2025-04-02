"use client"

import { VStack, Text } from "@chakra-ui/react"
import Title from "./Title"
import UserInfo from "./UserInfo"
import CurrentSignal from "./CurrentSignal"
import PeakSignalsContainer from "./peak-signals/PeakSignalsContainer"
import SignalStrengthContainer from "./signal-strength/SignalStrengthContainer"

import operatorData from "/public/data/userData.json"

export default function SignalDisplayContainer({ username }: { username: string }) {
    const data = operatorData[username as keyof typeof operatorData]
    if (!data) return <Text>{username} not found</Text>

    return (
        <VStack gap={3} w="100%" maxW="600px" borderRadius="20px" p={6} zIndex={10}>
            <Title />
            <UserInfo operatorImage={data.operatorImage} operatorNumber={data.operatorNumber} name={data.name} />
            <CurrentSignal signal={data.signal} signalValue={data.signalValue} signalColor={data.signalColor} />
            <PeakSignalsContainer peakSignals={data.peakSignals} />
            <SignalStrengthContainer metrics={data.metrics} />
        </VStack>
    )
}
