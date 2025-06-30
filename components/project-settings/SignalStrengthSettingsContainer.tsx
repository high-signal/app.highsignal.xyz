"use client"

import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import SignalStrengthSettings from "./SignalStrengthSettings"

export default function SignalStrengthSettingsContainer({
    project,
    setTriggerProjectRefetch,
}: {
    project: ProjectData
    setTriggerProjectRefetch: (trigger: boolean) => void
}) {
    const sortedSignalStrengths = [...(project.signalStrengths || [])].sort((a, b) => {
        // First sort by status priority
        const statusPriority: Record<string, number> = { active: 0, dev: 2 }
        const aPriority = statusPriority[a.status] ?? 1
        const bPriority = statusPriority[b.status] ?? 1

        if (aPriority !== bPriority) {
            return aPriority - bPriority
        }

        // Then sort alphabetically by name
        return a.name.localeCompare(b.name)
    })

    return (
        <SettingsSectionContainer maxWidth="800px">
            {sortedSignalStrengths.map((signalStrength) => (
                <SignalStrengthSettings
                    key={signalStrength.name}
                    project={project}
                    signalStrength={signalStrength}
                    setTriggerProjectRefetch={setTriggerProjectRefetch}
                />
            ))}
        </SettingsSectionContainer>
    )
}
