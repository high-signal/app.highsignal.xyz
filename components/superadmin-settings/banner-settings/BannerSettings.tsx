"use client"

import { useState } from "react"
import { Text, VStack, Button, HStack } from "@chakra-ui/react"

import SingleLineTextInput from "../../ui/SingleLineTextInput"
import { usePrivy } from "@privy-io/react-auth"

export default function BannerSettings({
    banner,
    setTriggerRefresh,
}: {
    banner: BannerProps
    setTriggerRefresh: React.Dispatch<React.SetStateAction<boolean>>
}) {
    // Create a local copy of the banner state to modify
    const [localBanner, setLocalBanner] = useState<BannerProps>(banner)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { getAccessToken } = usePrivy()

    const handleSave = async () => {
        try {
            setError(null) // Clear any previous errors when starting a new save attempt
            setIsSaving(true)
            const token = await getAccessToken()
            const response = await fetch("/api/settings/superadmin/banners", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ banner: localBanner }),
            })
            if (!response.ok) {
                const errorData = await response.json()
                setError(errorData.error)
                return
            }

            setTriggerRefresh((prev) => !prev)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error"
            console.error("Error saving banner:", errorMessage)
            setError(`Error saving banner: ${errorMessage}`)
        } finally {
            setIsSaving(false)
        }
    }

    // Check if there are any invalid boolean values
    const hasInvalidBooleans =
        (localBanner.enabled !== true && localBanner.enabled !== false) ||
        (localBanner.closable !== true && localBanner.closable !== false)

    // Check if the local banner is different from the banner prop
    const hasChanges =
        localBanner.type !== banner.type ||
        localBanner.style !== banner.style ||
        localBanner.title !== banner.title ||
        localBanner.content !== banner.content ||
        localBanner.enabled !== banner.enabled ||
        localBanner.closable !== banner.closable ||
        localBanner.internal_name !== banner.internal_name

    // Create an array of options to display in the banner settings
    const options = [
        {
            option: "type",
            note: "Can only be changed in the DB directly",
            value: localBanner.type,
            editable: false,
            editorType: "text",
        },
        {
            option: "internal_name",
            note: "Not visible to users",
            value: localBanner.internal_name,
            editable: true,
            editorType: "text",
        },
        {
            option: "enabled",
            note: "Can only be true or false",
            value: localBanner.enabled,
            editable: true,
            editorType: "boolean",
        },
        // TODO: Add style
        // { option: "style", value: localBanner.style, editable: true, editorType: "text" },
        {
            option: "closable",
            note: "Can only be true or false",
            value: localBanner.closable,
            editable: true,
            editorType: "boolean",
        },
        { option: "title", /* note: "Banner title", */ value: localBanner.title, editable: true, editorType: "text" },
        {
            option: "content",
            note: "All on one line, new lines do not work",
            value: localBanner.content,
            editable: true,
            editorType: "text",
        },
    ]

    return (
        <VStack
            alignItems="start"
            w={"100%"}
            bg="contentBackground"
            px={4}
            py={3}
            borderRadius={{ base: "0px", sm: "16px" }}
            gap={4}
        >
            {options
                .filter((option) => !(localBanner.type !== "header" && option.option === "closable"))
                .map((option) => (
                    <VStack key={option.option} alignItems="start" w="100%" gap={1}>
                        <HStack justifyContent="space-between" w="100%" px={3}>
                            <Text fontSize="sm" fontWeight="medium">
                                {option.option.charAt(0).toUpperCase() + option.option.slice(1)}:
                            </Text>
                            <Text fontSize="sm" fontWeight="medium" color="textColorMuted" pl={3}>
                                {option.note}
                            </Text>
                        </HStack>
                        <SingleLineTextInput
                            placeholder={"-"}
                            value={(() => {
                                const value = localBanner[option.option as keyof BannerProps]
                                if (option.editorType === "boolean") {
                                    if (value === true) return "true"
                                    if (value === false || value === undefined || value === null) return "false"
                                    return String(value) // Allow any other string value to display as-is
                                }
                                return String(value || "")
                            })()}
                            onChange={(e) => {
                                const value = e.target.value
                                let processedValue: string | boolean = value

                                // Convert boolean strings back to actual booleans
                                if (option.editorType === "boolean") {
                                    if (value === "true") {
                                        processedValue = true
                                    } else if (value === "false") {
                                        processedValue = false
                                    } else {
                                        // For invalid boolean values, keep as string to trigger validation error
                                        processedValue = value
                                    }
                                }

                                setLocalBanner({ ...localBanner, [option.option]: processedValue })
                            }}
                            isEditable={option.editable}
                            bg={option.editable ? "pageBackground" : "contentBackgroundHover"}
                        />
                        {/* If it is a boolean and the value is not true or false, show an error */}
                        {option.editorType === "boolean" &&
                            localBanner[option.option as keyof BannerProps] !== true &&
                            localBanner[option.option as keyof BannerProps] !== false && (
                                <Text fontSize="sm" fontWeight="medium" color="orange.500" pl={3}>
                                    {`${option.option.charAt(0).toUpperCase() + option.option.slice(1)} must be true or false`}
                                </Text>
                            )}
                    </VStack>
                ))}
            <HStack w={"100%"} justifyContent={"end"} pb={1} gap={3}>
                {hasChanges && (
                    <Text w={"100%"} pl={3} fontWeight="bold" color="orange.500" fontSize="sm">
                        Don&apos;t forget to save your changes!
                    </Text>
                )}
                <Button
                    secondaryButton
                    px={5}
                    py={1}
                    borderRadius={"full"}
                    disabled={!hasChanges || isSaving}
                    onClick={() => {
                        setLocalBanner(banner)
                    }}
                >
                    Cancel
                </Button>
                <Button
                    primaryButton
                    px={5}
                    py={1}
                    borderRadius={"full"}
                    disabled={!hasChanges || isSaving || hasInvalidBooleans}
                    loading={isSaving}
                    onClick={async () => {
                        await handleSave()
                    }}
                >
                    Save
                </Button>
            </HStack>
            {error && (
                <Text fontSize="sm" fontWeight="medium" color="orange.500" pl={3}>
                    {error}
                </Text>
            )}
        </VStack>
    )
}
