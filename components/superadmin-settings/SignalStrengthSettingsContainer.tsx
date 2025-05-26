"use client"

import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import SignalStrengthSettings from "./SignalStrengthSettings"

import SettingsTabbedContent from "../ui/SettingsTabbedContent"

export default function SignalStrengthSettingsContainer({
    signalStrengths,
}: {
    signalStrengths: SignalStrengthData[]
}) {
    return (
        <SettingsTabbedContent
            tabs={[
                ...signalStrengths.map((signalStrength) => ({
                    value: signalStrength.name,
                    label: signalStrength.displayName.split(" ")[0],
                    disabled: signalStrength.status != "active",
                    content: <SignalStrengthSettings signalStrength={signalStrength} />,
                })),
            ]}
        />
    )
}
