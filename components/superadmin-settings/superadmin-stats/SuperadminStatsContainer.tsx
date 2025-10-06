"use client"

import SettingsSectionContainer from "../../ui/SettingsSectionContainer"
import SuperadminStatsErrors from "./SuperadminStatsErrors"
import SuperadminStatsCharts from "./SuperadminStatsCharts"

export default function SuperadminStatsContainer() {
    return (
        <SettingsSectionContainer maxWidth="100%" gap={0}>
            <SuperadminStatsErrors />
            <SuperadminStatsCharts />
        </SettingsSectionContainer>
    )
}
