"use client"

import { VStack, Text, Button, HStack, Dialog, RadioGroup, Box, Image } from "@chakra-ui/react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "next/navigation"

import EditorModal from "../../ui/EditorModal"
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

type WalletAccountSettingsState = {
    name: { current: string | null; new: string | null }
    sharing: { current: "private" | "public" | "shared" | null; new: "private" | "public" | "shared" | null }
    userAddressesShared: { current: UserAddressShared[] | null; new: UserAddressShared[] | null }
}

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
    const [settings, setSettings] = useState<WalletAccountSettingsState | null>(null)
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
        : userAddressConfig.userAddressesShared.length > 0
          ? "shared"
          : "private"

    const resetSettingsState = useCallback(() => {
        setSettings({
            name: { current: userAddressConfig.addressName ?? null, new: null },
            sharing: {
                current: currentSharingSetting,
                new: null,
            },
            userAddressesShared: { current: userAddressConfig.userAddressesShared ?? null, new: null },
        })
    }, [userAddressConfig.addressName, userAddressConfig.userAddressesShared, currentSharingSetting])

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
            (settings?.sharing.new === "shared" && !settings?.userAddressesShared.new?.length) ||
            (settings?.sharing.new === null &&
                settings?.sharing.current === "shared" &&
                settings?.userAddressesShared.new?.length === 0)
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

                if (settings.name.new !== null && settings.name.new !== settings.name.current) {
                    changedFields.name = settings.name.new
                }

                if (settings.sharing.new !== null && settings.sharing.new !== settings.sharing.current) {
                    changedFields.sharing = settings.sharing.new
                }

                if (
                    settings.userAddressesShared.new !== null &&
                    JSON.stringify(settings.userAddressesShared.new) !==
                        JSON.stringify(settings.userAddressesShared.current)
                ) {
                    changedFields.userAddressesShared = settings.userAddressesShared.new.map(
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

    // Helper function to get the current list of projects to display
    const getCurrentProjectList = (): UserAddressShared[] => {
        if (!settings) return []
        if (settings.userAddressesShared?.new !== null) {
            return settings.userAddressesShared.new || []
        }
        return settings.userAddressesShared?.current || []
    }

    // Helper function to add a project to the list
    const addProject = (project: { urlSlug: string; displayName: string; projectLogoUrl?: string }) => {
        if (!settings) return

        const currentList = getCurrentProjectList()
        const newProject = {
            projectUrlSlug: project.urlSlug,
            projectDisplayName: project.displayName,
            projectLogoUrl: project.projectLogoUrl,
        }

        // Check if project already exists
        const projectExists = currentList.some((p) => p.projectUrlSlug === project.urlSlug)
        if (projectExists) return

        setSettings({
            ...settings,
            userAddressesShared: {
                ...settings.userAddressesShared,
                new: [...currentList, newProject],
            },
        })
    }

    // Helper function to remove a project from the list
    const removeProject = (projectUrlSlug: string) => {
        if (!settings) return

        const currentList = getCurrentProjectList()
        const filteredList = currentList.filter((p) => p.projectUrlSlug !== projectUrlSlug)

        setSettings({
            ...settings,
            userAddressesShared: {
                ...settings.userAddressesShared,
                new: filteredList,
            },
        })
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
                        value={settings.name.new ?? settings.name.current ?? ""}
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
                                name: { ...settings.name, new: e.target.value },
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
                <VStack>
                    <RadioGroup.Root
                        value={settings.sharing.new ?? settings.sharing.current ?? "private"}
                        onValueChange={(details: { value: string | null }) => {
                            const newSharingValue = details.value as "private" | "public" | "shared"

                            // If changing from shared to something else, clear the project list
                            const currentSharing = settings.sharing.new ?? settings.sharing.current
                            const shouldClearProjects = currentSharing === "shared" && newSharingValue !== "shared"

                            setSettings({
                                ...settings,
                                sharing: {
                                    ...settings.sharing,
                                    new: newSharingValue,
                                },
                                userAddressesShared: shouldClearProjects
                                    ? {
                                          ...settings.userAddressesShared,
                                          new: [],
                                      }
                                    : settings.userAddressesShared,
                            })
                        }}
                    >
                        <VStack gap={6} alignItems={"start"} w={"100%"}>
                            {[
                                {
                                    selected:
                                        (settings.sharing.current === "private" && !settings.sharing.new) ||
                                        settings.sharing.new === "private",
                                    value: "private",
                                    text: "Private",
                                    bgColor: "blue.800",
                                    borderColor: "transparent",
                                    textColor: "blue.100",
                                    itemBackground: "contentBackground",
                                    tip: "Private addresses are not visible to other users or projects.",
                                },
                                {
                                    selected:
                                        (settings.sharing.current === "public" && !settings.sharing.new) ||
                                        settings.sharing.new === "public",
                                    value: "public",
                                    text: "Public",
                                    bgColor: "green.500",
                                    borderColor: "transparent",
                                    textColor: "white",
                                    itemBackground: "contentBackground",
                                    tip: "Public addresses are visible to everyone.",
                                },
                                {
                                    selected:
                                        (settings.sharing.current === "shared" && !settings.sharing.new) ||
                                        settings.sharing.new === "shared",
                                    value: "shared",
                                    text: "Shared",
                                    bgColor: "teal.500",
                                    borderColor: "transparent",
                                    textColor: "white",
                                    itemBackground: "contentBackground",
                                    tip: "Share this address with selected projects.",
                                },
                            ].map((option) => (
                                <HStack key={option.value} gap={4} alignItems={{ base: "start", sm: "center" }}>
                                    <HStack minW={"110px"}>
                                        <CustomRadioItem option={option} />
                                    </HStack>
                                    <Text fontSize={"sm"} color={"textColorMuted"}>
                                        {option.tip}
                                    </Text>
                                </HStack>
                            ))}
                        </VStack>
                    </RadioGroup.Root>
                </VStack>
                {(settings.sharing.new === "shared" ||
                    (settings.sharing.new === null && settings.sharing.current === "shared")) && (
                    <HStack
                        bg={"contentBackground"}
                        borderRadius={{ base: "25px", sm: "35px" }}
                        p={4}
                        w={"100%"}
                        flexWrap={"wrap"}
                        gap={4}
                    >
                        <Box w={"300px"} maxW={"100%"}>
                            <ProjectPicker
                                onProjectSelect={(project) => {
                                    addProject(project)
                                }}
                                selectorText={`Select projects to share with...`}
                                placeholder={"Search..."}
                            />
                        </Box>
                        <HStack flexWrap={"wrap"} gap={3}>
                            {sharingValidationError ? (
                                <Text color={"orange.500"} pl={1} fontWeight={"bold"}>
                                    {sharingValidationError}
                                </Text>
                            ) : (
                                getCurrentProjectList().map((project) => (
                                    <HStack
                                        key={project.projectUrlSlug}
                                        bg={"pageBackground"}
                                        pr={2}
                                        borderRadius="full"
                                        cursor="default"
                                        h={"35px"}
                                    >
                                        <Image
                                            src={
                                                !project.projectLogoUrl || project.projectLogoUrl === ""
                                                    ? ASSETS.DEFAULT_PROFILE_IMAGE
                                                    : project.projectLogoUrl
                                            }
                                            alt={`${project.projectDisplayName} Logo`}
                                            fit="cover"
                                            w="35px"
                                            borderRadius="full"
                                        />
                                        <Text fontWeight={"bold"}>{project.projectDisplayName}</Text>
                                        <Button
                                            secondaryButton
                                            borderRadius="full"
                                            p={0}
                                            minW="auto"
                                            h="20px"
                                            onClick={() => removeProject(project.projectUrlSlug)}
                                        >
                                            <FontAwesomeIcon icon={faXmark} />
                                        </Button>
                                    </HStack>
                                ))
                            )}
                        </HStack>
                    </HStack>
                )}
            </VStack>
        </EditorModal>
    )
}
