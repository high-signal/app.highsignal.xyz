"use client"

import { VStack, Text } from "@chakra-ui/react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "next/navigation"

import EditorModal from "../../ui/EditorModal"
import { toaster } from "../../ui/toaster"
import SharingRadioGroup from "../../ui/SharingRadioGroup"

import { useUser } from "../../../contexts/UserContext"
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
    const [settings, setSettings] = useState<EditorSettingsState | null>(null)
    const [hasChanges, setHasChanges] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [sharingValidationError, setSharingValidationError] = useState<string | null>(null)
    const [shouldCloseAfterSave, setShouldCloseAfterSave] = useState(false)
    const previousSharingConfigRef = useRef(sharingConfig)

    const { refreshUser } = useUser()

    const params = useParams()
    const targetUsername = params.username as string

    const currentSharingSetting: "private" | "public" | "shared" = sharingConfig?.isPublic
        ? "public"
        : (sharingConfig?.userAccountsShared?.length ?? 0) > 0
          ? "shared"
          : "private"

    const resetSettingsState = useCallback(() => {
        setSettings({
            sharing: {
                current: currentSharingSetting,
                new: null,
            },
            projectsSharedWith: {
                current: sharingConfig?.userAccountsShared?.map((ua) => ua.project) ?? null,
                new: null,
            },
        })
    }, [currentSharingSetting, sharingConfig?.userAccountsShared])

    // Set the settings to the initial state on first render
    useEffect(() => {
        resetSettingsState()
    }, [resetSettingsState])

    // Check for changes whenever settings change
    useEffect(() => {
        if (!settings) return
        const hasChanges = Object.values(settings).some(
            (setting) => setting.new !== null && setting.new !== setting.current,
        )
        setHasChanges(hasChanges)
    }, [settings])

    // When sharing is set to shared there must be at least one project selected
    useEffect(() => {
        if (
            (settings?.sharing.new === "shared" && !settings?.projectsSharedWith.new?.length) ||
            (settings?.sharing.new === null &&
                settings?.sharing.current === "shared" &&
                settings?.projectsSharedWith.new?.length === 0)
        ) {
            setSharingValidationError('To use the "Shared" option you must select at least one project')
        } else {
            setSharingValidationError(null)
        }
    }, [settings])

    // When sharingConfig changes after a successful save, close the modal
    useEffect(() => {
        if (shouldCloseAfterSave && sharingConfig !== previousSharingConfigRef.current) {
            setIsSaving(false)
            setShouldCloseAfterSave(false)
            onClose()
        }
        previousSharingConfigRef.current = sharingConfig
    }, [sharingConfig, shouldCloseAfterSave, onClose])

    // Save the settings
    const handleSave = async () => {
        if (!settings || !hasChanges) return

        if (!sharingValidationError) {
            setIsSaving(true)
            try {
                // Create changedFields object with only modified fields
                const changedFields: any = {}

                if (settings.sharing.new !== null && settings.sharing.new !== settings.sharing.current) {
                    changedFields.sharing = settings.sharing.new
                }

                if (
                    settings.projectsSharedWith.new !== null &&
                    JSON.stringify(settings.projectsSharedWith.new) !==
                        JSON.stringify(settings.projectsSharedWith.current)
                ) {
                    changedFields.projectsSharedWith = settings.projectsSharedWith.new.map(
                        (project) => project.projectUrlSlug,
                    )
                }

                const token = await getAccessToken()
                const response = await fetch(
                    `/api/settings/u/accounts/privy-accounts?username=${targetUsername}&accountType=${sharingConfig?.type}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ changedFields }),
                    },
                )
                if (!response.ok) {
                    const jsonResponse = await response.json()
                    console.error("Error saving settings:", jsonResponse)
                    toaster.create({
                        title: "❌ Error saving settings",
                        description: jsonResponse.error,
                        type: "error",
                    })
                    setIsSaving(false)
                } else {
                    toaster.create({
                        title: "✅ Settings saved successfully",
                        type: "success",
                    })
                    setShouldCloseAfterSave(true)
                    await refreshUser()
                }
            } catch (error) {
                console.error("Error saving settings:", error)
                toaster.create({
                    title: "❌ Error saving settings",
                    description: error instanceof Error ? error.message : "An unknown error occurred",
                    type: "error",
                })
                setIsSaving(false)
            }
        }
    }

    // Reset the settings to the initial state when the cancel button is clicked
    const handleClose = () => {
        resetSettingsState()
        onClose()
    }

    // If the settings are not loaded, do not render anything
    if (!settings) return null

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
            <VStack w={"100%"} alignItems={"start"} gap={3}>
                <SharingRadioGroup
                    settings={settings}
                    setSettings={setSettings}
                    sharingValidationError={sharingValidationError}
                />
            </VStack>
        </EditorModal>
    )
}
