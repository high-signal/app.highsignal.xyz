"use client"

import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import SignalStrengthSettings from "./SignalStrengthSettings"

export default function SignalStrengthSettingsContainer({ project }: { project: ProjectData }) {
    return (
        <SettingsSectionContainer title="Signal Strength Settings" maxWidth="1300px">
            {project.signalStrengths?.map((signalStrength) => (
                <SignalStrengthSettings
                    key={signalStrength.name}
                    title={signalStrength.displayName}
                    value={signalStrength.maxValue.toString()}
                    onChange={() => {}}
                    onKeyDown={() => {}}
                    isEnabled={signalStrength.enabled}
                    status={signalStrength.status}
                />
            ))}
        </SettingsSectionContainer>
    )
}
