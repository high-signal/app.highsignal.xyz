"use client"

import { Text, VStack } from "@chakra-ui/react"

import SettingsSectionContainer from "../ui/SettingsSectionContainer"

export default function BannersSettingsContainer() {
    return (
        <SettingsSectionContainer>
            <VStack alignItems="start" w={"100%"}>
                <Text fontSize="xl" fontWeight="bold">
                    Banners
                </Text>
                <Text>TODO</Text>
            </VStack>
        </SettingsSectionContainer>
    )
}
