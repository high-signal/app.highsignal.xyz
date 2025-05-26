"use client"

import { Text, Spinner } from "@chakra-ui/react"
import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import SignalStrengthSettings from "./SignalStrengthSettings"
import { useEffect, useState } from "react"
import { getAccessToken } from "@privy-io/react-auth"

export default function SignalStrengthSettingsContainer({ signalStrength }: { signalStrength: SignalStrengthData }) {
    return (
        <SettingsSectionContainer maxWidth="100%" px={{ base: 0, sm: 4 }}>
            <SignalStrengthSettings signalStrength={signalStrength} />
        </SettingsSectionContainer>
    )
}
