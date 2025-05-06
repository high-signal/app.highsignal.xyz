"use client"

import { useEffect, useState } from "react"
import { Text } from "@chakra-ui/react"
import { toaster } from "../ui/toaster"

import { useUser } from "../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"
import { validateUrlSlug, validateDisplayName } from "../../utils/inputValidation"

import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import ImageEditor from "../ui/ImageEditor"
import SettingsInputField from "../ui/SettingsInputField"

export default function GeneralSettingsContainer() {
    const { refreshUser } = useUser()
    const { getAccessToken } = usePrivy()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    return (
        <SettingsSectionContainer>
            <Text>No General Settings for Super Admin</Text>
        </SettingsSectionContainer>
    )
}
