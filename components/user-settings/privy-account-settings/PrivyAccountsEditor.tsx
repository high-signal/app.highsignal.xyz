"use client"

import { VStack, Text, Button, HStack, Dialog, RadioGroup, Box, Image } from "@chakra-ui/react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "next/navigation"

import EditorModal from "../../ui/EditorModal"
import ModalCloseButton from "../../ui/ModalCloseButton"

import SingleLineTextInput from "../../ui/SingleLineTextInput"
import { CustomRadioItem } from "../../ui/CustomRadioGroup"
import { toaster } from "../../ui/toaster"
import ProjectPicker from "../../ui/ProjectPicker"

import { validateAddressName } from "../../../utils/inputValidation"
import { ASSETS } from "../../../config/constants"
import { useUser } from "../../../contexts/UserContext"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCopy, faXmark } from "@fortawesome/free-solid-svg-icons"
import { faCheckCircle } from "@fortawesome/free-regular-svg-icons"
import { getAccessToken } from "@privy-io/react-auth"
import { PrivyAccountConfig } from "./LinkPrivyAccountsContainer"

export default function PrivyAccountsEditor({
    isOpen,
    onClose,
    accountConfig,
    sharingConfig,
}: {
    isOpen: boolean
    onClose: () => void
    accountConfig: PrivyAccountConfig
    sharingConfig: UserPublicOrSharedAccount | null
}) {
    // const [settings, setSettings] = useState<PrivyAccountSettingsState | null>(null)
    const [hasChanges, setHasChanges] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [sharingValidationError, setSharingValidationError] = useState<string | null>(null)
    const [shouldCloseAfterSave, setShouldCloseAfterSave] = useState(false)

    const { refreshUser } = useUser()

    const params = useParams()
    const targetUsername = params.username as string

    // Save the settings
    const handleSave = async () => {
        console.log("Saving!")
    }

    // Reset the settings to the initial state when the cancel button is clicked
    const handleClose = () => {
        // resetSettingsState()
        onClose()
    }

    // TODO: Remove after testing
    // console.log("sharingConfig", sharingConfig)
    // console.log("accountConfig", accountConfig)

    // If the accountConfig are not loaded, do not render anything
    if (!accountConfig) return null

    return (
        <EditorModal
            isOpen={isOpen}
            handleClose={handleClose}
            hasChanges={hasChanges}
            title={`Edit sharing settings for ${accountConfig.displayName.charAt(0).toUpperCase() + accountConfig.displayName.slice(1)}`}
            isSaving={isSaving}
            handleSave={handleSave}
            disabled={!hasChanges || isSaving || !!sharingValidationError}
        >
            <Text>Child components go here</Text>
        </EditorModal>
    )
}
