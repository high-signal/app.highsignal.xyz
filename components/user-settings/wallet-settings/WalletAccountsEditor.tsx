"use client"

import { VStack, Text, Button, HStack, Dialog, RadioGroup } from "@chakra-ui/react"
import { useState, useEffect, useMemo } from "react"

import Modal from "../../ui/Modal"
import ModalCloseButton from "../../ui/ModalCloseButton"
import SingleLineTextInput from "../../ui/SingleLineTextInput"
import { CustomRadioItem } from "../../ui/CustomRadioGroup"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCopy, faXmark } from "@fortawesome/free-solid-svg-icons"
import { faCheckCircle } from "@fortawesome/free-regular-svg-icons"
import { toaster } from "../../ui/toaster"

type WalletAccountSettingsState = {
    name: { current: string | null; new: string | null }
    sharing: { current: "private" | "public" | "shared" | null; new: "private" | "public" | "shared" | null }
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

    // Set the settings to the initial state when the modal opens
    useEffect(() => {
        if (isOpen) {
            setSettings({
                name: { current: userAddressConfig.addressName ?? null, new: null },
                sharing: {
                    current: (userAddressConfig.isPublic ? "public" : "private") as "private" | "public" | "shared",
                    new: null,
                },
            })
        }
    }, [isOpen, userAddressConfig])

    // Check for changes whenever settings change
    useEffect(() => {
        if (!settings) return
        const hasChanges = Object.values(settings).some(
            (setting) => setting.new !== null && setting.new !== setting.current,
        )
        setHasChanges(hasChanges)
    }, [settings])

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
    const handleSave = () => {
        if (!settings || !hasChanges) return
        // TODO: Implement save functionality
        console.log("Saving settings:", settings)
        onClose()
    }

    // If the settings are not loaded, do not render anything
    if (!settings) return null

    return (
        <Modal open={isOpen} close={onClose}>
            <Dialog.Content
                borderRadius={{ base: "0px", md: "16px" }}
                p={0}
                bg={"pageBackground"}
                maxW={"900px"}
                minH={"50dvh"}
            >
                <Dialog.Header>
                    <Dialog.Title maxW={"100%"}>
                        <HStack flexWrap="wrap">
                            <Text fontWeight="bold">Edit settings for address</Text>
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
                        </HStack>
                        <ModalCloseButton onClose={onClose} />
                    </Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                    <VStack gap={6} alignItems={"start"}>
                        <HStack w={"100%"} gap={2} flexWrap={"wrap"}>
                            <Text fontWeight={"bold"} fontSize={"md"}>
                                Address name
                            </Text>
                            <SingleLineTextInput
                                value={settings.name.new ?? settings.name.current ?? ""}
                                onChange={(e) => {
                                    setSettings({
                                        ...settings,
                                        name: { ...settings.name, new: e.target.value },
                                    })
                                }}
                                maxW={"200px"}
                                minW={"100px"}
                                h={"36px"}
                            />
                            <VStack alignItems={"start"} gap={0}>
                                <Text fontSize={"sm"} color={"textColorMuted"}>
                                    Give this address a useful name.
                                </Text>
                                <Text fontSize={"sm"} color={"textColorMuted"}>
                                    This name is private and will not be shared with other users or projects.
                                </Text>
                            </VStack>
                        </HStack>
                        <VStack w={"100%"} alignItems={"start"} gap={3}>
                            <Text fontWeight={"bold"} fontSize={"md"}>
                                Sharing settings
                            </Text>
                            <VStack>
                                <RadioGroup.Root
                                    value={settings.sharing.new ?? settings.sharing.current ?? "private"}
                                    onValueChange={(details: { value: string | null }) => {
                                        setSettings({
                                            ...settings,
                                            sharing: {
                                                ...settings.sharing,
                                                new: details.value as "private" | "public" | "shared",
                                            },
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
                                                tip: "Private addresses are not visible to other users.",
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
                                            <HStack
                                                key={option.value}
                                                gap={4}
                                                alignItems={{ base: "start", md: "center" }}
                                            >
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
                                    borderRadius={"16px"}
                                    p={4}
                                    w={"100%"}
                                    flexWrap={"wrap"}
                                >
                                    <Text>(Project Picker - Select projects to share this address with)</Text>
                                    <HStack>
                                        <HStack
                                            pl={3}
                                            pr={2}
                                            py={1}
                                            bg={"pageBackground"}
                                            borderRadius={"full"}
                                            fontSize={"md"}
                                            gap={3}
                                        >
                                            <Text>Project 1</Text>
                                            <FontAwesomeIcon icon={faXmark} />
                                        </HStack>
                                    </HStack>
                                </HStack>
                            )}
                        </VStack>
                    </VStack>
                </Dialog.Body>
                <Dialog.Footer>
                    <HStack minW={"100%"} justifyContent={{ base: "center", md: "end" }} flexWrap={"wrap"} gap={5}>
                        <Button secondaryButton borderRadius={"full"} px={4} py={2} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            primaryButton
                            borderRadius={"full"}
                            px={4}
                            py={2}
                            disabled={!hasChanges}
                            onClick={handleSave}
                        >
                            <Text>Save changes</Text>
                        </Button>
                    </HStack>
                </Dialog.Footer>
            </Dialog.Content>
        </Modal>
    )
}
