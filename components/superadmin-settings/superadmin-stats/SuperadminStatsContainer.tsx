"use client"

import SettingsSectionContainer from "../../ui/SettingsSectionContainer"
import SuperadminStatsOverview from "./SuperadminStatsOverview"
import SuperadminStatsCharts from "./SuperadminStatsCharts"

export default function SuperadminStatsContainer() {
    return (
        <SettingsSectionContainer maxWidth="100%">
            <SuperadminStatsOverview />
            <SuperadminStatsCharts />
        </SettingsSectionContainer>
    )
}
