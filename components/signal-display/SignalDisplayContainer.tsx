"use client"

import { VStack, Text, Spinner } from "@chakra-ui/react"
import Title from "./Title"
import UserInfo from "./UserInfo"
import CurrentSignal from "./CurrentSignal"
import PeakSignalsContainer from "./peak-signals/PeakSignalsContainer"
import SignalStrengthContainer from "./signal-strength/SignalStrengthContainer"

import { useGetUsers } from "../../hooks/useGetUsers"

export default function SignalDisplayContainer({ project, username }: { project: string; username: string }) {
    const { users, loading, error } = useGetUsers(project, username)
    const currentUser = users[0]

    if (loading) {
        return (
            <VStack gap={10} w="100%" minH="300px" justifyContent="center" alignItems="center" borderRadius="20px">
                <Spinner size="lg" />
            </VStack>
        )
    }

    if (error) {
        return (
            <VStack gap={10} w="100%" maxW="800px" borderRadius="20px">
                <Text color="red.500">Error: {error}</Text>
            </VStack>
        )
    }

    return (
        <VStack gap={3} w="100%" maxW="600px" borderRadius="20px" py={6} px={3} zIndex={10}>
            <Title />
            <UserInfo profileImageUrl={currentUser.profileImageUrl} name={currentUser.displayName} />
            <CurrentSignal signal={currentUser.signal} signalValue={currentUser.score} />
            <PeakSignalsContainer peakSignals={currentUser.peakSignals} />
            <SignalStrengthContainer signalStrengths={currentUser.signalStrengths} />
        </VStack>
    )
}
