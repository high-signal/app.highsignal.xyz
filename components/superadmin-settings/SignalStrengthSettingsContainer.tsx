"use client"

import { Text, Spinner } from "@chakra-ui/react"
import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import SignalStrengthSettings from "./SignalStrengthSettings"
import { useEffect, useState } from "react"
import { getAccessToken } from "@privy-io/react-auth"

export default function SignalStrengthSettingsContainer() {
    const [signalStrengths, setSignalStrengths] = useState<SignalStrengthData[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Lookup all signal strengths from the database
    useEffect(() => {
        const fetchSignalStrengths = async () => {
            const token = await getAccessToken()

            const response = await fetch("/api/settings/superadmin/signal-strengths", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            const data = await response.json()
            const sortedSignalStrengths = data.signalStrengths.sort((a: SignalStrengthData, b: SignalStrengthData) => {
                // First sort by status priority
                const statusPriority: Record<string, number> = { active: 0, dev: 1 }
                const aPriority = statusPriority[a.status] ?? 2
                const bPriority = statusPriority[b.status] ?? 2

                if (aPriority !== bPriority) {
                    return aPriority - bPriority
                }

                // Then sort alphabetically by display name
                return a.displayName.localeCompare(b.displayName)
            })
            setSignalStrengths(sortedSignalStrengths)
            setIsLoading(false)
        }
        fetchSignalStrengths()
    }, [])

    return (
        <SettingsSectionContainer maxWidth="1300px">
            {isLoading ? (
                <Spinner />
            ) : signalStrengths && signalStrengths.length > 0 ? (
                signalStrengths.map((signalStrength) => (
                    <SignalStrengthSettings key={signalStrength.name} signalStrength={signalStrength} />
                ))
            ) : (
                <Text>No signal strengths found</Text>
            )}
        </SettingsSectionContainer>
    )
}
