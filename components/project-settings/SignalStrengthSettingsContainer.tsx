"use client"

import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import SignalStrengthSettings from "./SignalStrengthSettings"

export default function SignalStrengthSettingsContainer({ project }: { project: ProjectData }) {
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
        <SettingsSectionContainer maxWidth="1300px">
            {sortedSignalStrengths.map((signalStrength) => (
                <SignalStrengthSettings key={signalStrength.name} signalStrength={signalStrength} />
            ))}
        </SettingsSectionContainer>
    )
}
