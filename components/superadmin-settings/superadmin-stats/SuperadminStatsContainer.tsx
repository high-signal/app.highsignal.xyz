"use client"

import SettingsSectionContainer from "../../ui/SettingsSectionContainer"
import SuperadminStatsErrors from "./SuperadminStatsErrors"
import SuperadminStatsCharts from "./SuperadminStatsCharts"

export default function SuperadminStatsContainer() {
    return (
        <SettingsSectionContainer maxWidth="100%">
            <SuperadminStatsErrors />
            <SuperadminStatsCharts />
        </SettingsSectionContainer>
    )
}
