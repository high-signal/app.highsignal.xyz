"use client"

import { VStack, Text, Button, HStack } from "@chakra-ui/react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "next/navigation"

import EditorModal from "../../ui/EditorModal"
import SingleLineTextInput from "../../ui/SingleLineTextInput"
import { toaster } from "../../ui/toaster"
import SharingRadioGroup from "../../ui/SharingRadioGroup"

import { validateAddressName } from "../../../utils/inputValidation"
import { useUser } from "../../../contexts/UserContext"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCopy } from "@fortawesome/free-solid-svg-icons"
import { faCheckCircle } from "@fortawesome/free-regular-svg-icons"
import { getAccessToken } from "@privy-io/react-auth"

export default function WalletAccountsEditor({
    isOpen,
    onClose,
    userAddressConfig,
}: {
    isOpen: boolean
    onClose: () => void
    userAddressConfig: UserAddressConfig
}) {
    const [isCopied, setIsCopied] = useState(false)
    const [settings, setSettings] = useState<EditorSettingsState | null>(null)
    const [hasChanges, setHasChanges] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [addressNameValidationError, setAddressNameValidationError] = useState<string | null>(null)
    const [sharingValidationError, setSharingValidationError] = useState<string | null>(null)
    const [shouldCloseAfterSave, setShouldCloseAfterSave] = useState(false)
    const previousUserAddressConfigRef = useRef(userAddressConfig)

    const { refreshUser } = useUser()

    const params = useParams()
    const targetUsername = params.username as string

    const currentSharingSetting: "private" | "public" | "shared" = userAddressConfig.isPublic
        ? "public"
        : userAddressConfig.projectsSharedWith.length > 0
          ? "shared"
          : "private"

    const resetSettingsState = useCallback(() => {
        setSettings({
            name: { current: userAddressConfig.addressName ?? null, new: null },
            sharing: {
                current: currentSharingSetting,
                new: null,
            },
            projectsSharedWith: { current: userAddressConfig.projectsSharedWith ?? null, new: null },
        })
    }, [userAddressConfig.addressName, userAddressConfig.projectsSharedWith, currentSharingSetting])

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

    // When userAddressConfig changes after a successful save, close the modal
    // This waits for the new state to be loaded before closing the modal to improve UX
    // so the user does not see a flash of the old state before the new state is loaded
    useEffect(() => {
        if (shouldCloseAfterSave && userAddressConfig !== previousUserAddressConfigRef.current) {
            setIsSaving(false)
            setShouldCloseAfterSave(false)
            onClose()
        }
        previousUserAddressConfigRef.current = userAddressConfig
    }, [userAddressConfig, shouldCloseAfterSave, onClose])

    // Copy the address to the clipboard
    const handleCopyAddress = async () => {
        try {
            await navigator.clipboard.writeText(userAddressConfig.address)
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy address:", err)
        }
    }

    // Save the settings
    const handleSave = async () => {
        if (!settings || !hasChanges) return

        if (!addressNameValidationError && !sharingValidationError) {
            setIsSaving(true)
            try {
                // Create changedFields object with only modified fields
                const changedFields: any = {}

                if (settings.name?.new !== null && settings.name?.new !== settings.name?.current) {
                    changedFields.name = settings.name?.new
                }

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
                    `/api/settings/u/accounts/addresses?username=${targetUsername}&address=${userAddressConfig.address}`,
                    {
                        method: "POST",
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
            title="Edit settings for address"
            titleRight={
                <HStack bg={"contentBackground"} borderRadius={"full"} gap={0}>
                    <Text
                        fontSize={"md"}
                        fontFamily={"monospace"}
                        wordBreak="break-all"
                        px={{ base: 6, md: 3 }}
                        py={{ base: 2, md: 1 }}
                    >
                        {userAddressConfig.address}
                    </Text>
                    <Button
                        secondaryButton
                        onClick={handleCopyAddress}
                        borderRadius="full"
                        pl={2}
                        pr={3}
                        mr={{ base: 3, md: 0 }}
                        py={1}
                        h={"36px"}
                    >
                        <HStack gap={1}>
                            <FontAwesomeIcon icon={isCopied ? faCheckCircle : faCopy} />
                            <Text fontSize="sm" fontWeight="bold">
                                {isCopied ? "Copied" : "Copy"}
                            </Text>
                        </HStack>
                    </Button>
                </HStack>
            }
            isSaving={isSaving}
            handleSave={handleSave}
            disabled={!hasChanges || isSaving || !!addressNameValidationError || !!sharingValidationError}
        >
            <VStack w={"100%"} gap={2} flexWrap={"wrap"} alignItems={"start"}>
                <Text fontWeight={"bold"} fontSize={"md"} pl={1}>
                    Address name (optional)
                </Text>
                <HStack w={"100%"} gap={2} flexWrap={"wrap"}>
                    <SingleLineTextInput
                        value={settings.name?.new ?? settings.name?.current ?? ""}
                        placeholder="e.g. Treasure Chest"
                        onChange={(e) => {
                            const error = validateAddressName(e.target.value)
                            if (error) {
                                setAddressNameValidationError(error)
                            } else {
                                setAddressNameValidationError(null)
                            }
                            setSettings({
                                ...settings,
                                ...(settings.name && { name: { ...settings.name, new: e.target.value } }),
                            })
                        }}
                        maxW={"300px"}
                        minW={"100px"}
                        h={"36px"}
                    />
                    <VStack alignItems={"start"} gap={0} pl={1}>
                        <Text fontSize={"sm"} color={"textColorMuted"}>
                            Give this address a friendly name.
                        </Text>
                        <Text fontSize={"sm"} color={"textColorMuted"}>
                            This name is private and will not be shared with other users or projects.
                        </Text>
                    </VStack>
                    {addressNameValidationError && (
                        <Text fontSize={"sm"} color={"orange.500"} pl={1}>
                            {addressNameValidationError}
                        </Text>
                    )}
                </HStack>
            </VStack>
            <VStack w={"100%"} alignItems={"start"} gap={3}>
                <Text fontWeight={"bold"} fontSize={"md"} pl={1}>
                    Sharing settings
                </Text>
                <SharingRadioGroup
                    settings={settings}
                    setSettings={setSettings}
                    sharingValidationError={sharingValidationError}
                    setSharingValidationError={setSharingValidationError}
                />
            </VStack>
        </EditorModal>
    )
}
