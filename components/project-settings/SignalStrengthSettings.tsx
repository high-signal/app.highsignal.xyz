import { HStack, Text, VStack, Box, Switch, Button, Span, RadioGroup } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowRight, faCheck, faChevronRight } from "@fortawesome/free-solid-svg-icons"
import { useEffect, useState } from "react"
import SingleLineTextInput from "../ui/SingleLineTextInput"
import { usePrivy } from "@privy-io/react-auth"
import {
    validateSignalStrengthProjectSettings,
    ValidationError,
} from "../../utils/validateSignalStrengthProjectSettings"

function ValidationErrorDisplay({ errors, field }: { errors: ValidationError[]; field: string }) {
    return (
        <>
            {errors
                .filter((error) => error.field === field)
                .map((error, index) => (
                    <Text key={index} color={"orange.500"} fontSize="sm" pl={"14px"}>
                        {error.message}
                    </Text>
                ))}
        </>
    )
}

function AuthTypeSwitch({
    authType,
    label,
    settings,
    setSettings,
}: {
    authType: string
    label: string
    settings: SignalStrengthProjectSettingsState
    setSettings: (settings: SignalStrengthProjectSettingsState) => void
}) {
    const currentAuthTypes = settings.authTypes.new ?? settings.authTypes.current ?? []

    // When the settings changes, if any of the new values are the same as the current values
    // set the new values to null
    useEffect(() => {}, [settings])

    const isChecked = currentAuthTypes.includes(authType)

    return (
        <Switch.Root
            size={"lg"}
            cursor={"pointer"}
            variant={"solid"}
            checked={isChecked}
            onCheckedChange={(e) => {
                const newAuthTypes = e.checked
                    ? [...currentAuthTypes, authType]
                    : currentAuthTypes.filter((type) => type !== authType)

                setSettings({
                    ...settings,
                    authTypes: { ...settings.authTypes, new: newAuthTypes },
                })
            }}
        >
            <Switch.HiddenInput />
            <Switch.Control bg={"pageBackground"} borderRadius={"full"} border={"none"}>
                <Switch.Thumb bg={"textColor"} _checked={{ bg: "lozenge.text.active" }}>
                    {isChecked && <FontAwesomeIcon icon={faCheck} />}
                </Switch.Thumb>
            </Switch.Control>
            <Switch.Label>{label}</Switch.Label>
        </Switch.Root>
    )
}

export default function SignalStrengthSettings({
    project,
    signalStrength,
}: {
    project: ProjectData
    signalStrength: SignalStrengthProjectData
}) {
    const { getAccessToken } = usePrivy()
    const [isOpen, setIsOpen] = useState(false)
    const [settings, setSettings] = useState<SignalStrengthProjectSettingsState>({
        enabled: {
            current: signalStrength.enabled,
            new: null,
        },
        maxValue: {
            current: signalStrength.maxValue,
            new: null,
        },
        previousDays: {
            current: signalStrength.previousDays,
            new: null,
        },
        url: {
            current: signalStrength.url ?? null,
            new: null,
        },
        authTypes: {
            current: signalStrength.authTypes ?? null,
            new: null,
        },
        authParentPostUrl: {
            current: signalStrength.authParentPostUrl ?? null,
            new: null,
        },
    })
    const [hasChanges, setHasChanges] = useState(false)
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [savingError, setSavingError] = useState<string | null>(null)

    useEffect(() => {
        const hasChanges = Object.values(settings).some(
            (setting) => setting.new !== null && setting.new !== setting.current,
        )
        setHasChanges(hasChanges)

        // Validate settings whenever they change
        const errors = validateSignalStrengthProjectSettings(settings)
        setValidationErrors(errors)
    }, [settings])

    const handleCancel = async () => {
        const resetSettings = Object.keys(settings).reduce(
            (acc, key) => ({
                ...acc,
                [key]: { ...settings[key as keyof SignalStrengthProjectSettingsState], new: null },
            }),
            {} as SignalStrengthProjectSettingsState,
        )
        setSettings(resetSettings)
        setIsSaving(false)
        setSavingError(null)
    }

    const handleSave = async () => {
        if (hasChanges && validationErrors.length === 0) {
            setIsSaving(true)
            const token = await getAccessToken()
            const response = await fetch(
                `/api/settings/p/signal-strengths?project=${project.urlSlug}&signal_strength=${signalStrength.name}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ settings }),
                },
            )
            if (!response.ok) {
                const jsonResponse = await response.json()
                console.error("Error saving settings:", jsonResponse)
                const errorMessages = jsonResponse.error.map((err: { message: string }) => err.message).join(", ")
                setSavingError(errorMessages)
            } else {
                // TODO: Refetch the signal strength data
                // TODO: Set all new to null (if that is not covered in the refetch)
                setSavingError(null)
            }
            setIsSaving(false)
        }
    }

    return (
        <VStack w="100%" gap={0}>
            <HStack
                justify="space-between"
                w="500px"
                maxW={"100%"}
                bg={"contentBackground"}
                py={3}
                px={{ base: 2, md: 4 }}
                borderRadius={{ base: "0px", md: "16px" }}
                borderBottomRadius={{ base: "0px", md: isOpen ? "0px" : "16px" }}
                flexWrap={"wrap"}
                cursor={signalStrength.status !== "dev" ? "pointer" : "disabled"}
                onClick={() => signalStrength.status !== "dev" && setIsOpen(!isOpen)}
                _hover={signalStrength.status !== "dev" ? { bg: "contentBackgroundHover" } : undefined}
            >
                <HStack py={2} px={1} borderRadius={"8px"} gap={3}>
                    <Box w={"10px"} transition="transform 0.2s" transform={`rotate(${isOpen ? 90 : 0}deg)`}>
                        {signalStrength.status !== "dev" && <FontAwesomeIcon icon={faChevronRight} />}
                    </Box>
                    <Text
                        w="fit-content"
                        fontWeight="bold"
                        fontSize="lg"
                        whiteSpace="nowrap"
                        color={signalStrength.status === "dev" ? "textColorMuted" : undefined}
                    >
                        {signalStrength.displayName}{" "}
                        {hasChanges && (
                            <Span pl={2} fontSize={"sm"} color={"orange.500"} fontWeight={"bold"}>
                                Edited
                            </Span>
                        )}
                    </Text>
                </HStack>
                <HStack flexGrow={1} justify={"end"}>
                    <HStack
                        bg={
                            signalStrength.status !== "dev" && settings.enabled.current
                                ? "lozenge.background.active"
                                : "lozenge.background.disabled"
                        }
                        px={2}
                        py={1}
                        borderRadius={"full"}
                        border={"2px solid"}
                        borderColor={
                            signalStrength.status !== "dev" && settings.enabled.current
                                ? "lozenge.border.active"
                                : "lozenge.border.disabled"
                        }
                        fontWeight={"bold"}
                        fontSize={"sm"}
                    >
                        <Text
                            color={
                                signalStrength.status !== "dev" && settings.enabled.current
                                    ? "lozenge.text.active"
                                    : "lozenge.text.disabled"
                            }
                        >
                            {signalStrength.status === "dev"
                                ? "Coming soon 🏗️"
                                : settings.enabled.current
                                  ? "Active"
                                  : "Disabled"}
                        </Text>
                    </HStack>
                </HStack>
            </HStack>
            {isOpen && (
                <VStack
                    w={{ base: "100%", md: "500px" }}
                    pb={2}
                    gap={5}
                    bg={"contentBackground"}
                    p={4}
                    borderBottomRadius={{ base: "0px", md: "16px" }}
                    alignItems={"start"}
                    borderTopWidth={3}
                    borderTopColor={"contentBorder"}
                >
                    <HStack alignItems={"center"} columnGap={6} rowGap={3} w={"100%"} flexWrap={"wrap"}>
                        <Text fontWeight={"bold"} minW={"120px"}>
                            Status
                        </Text>
                        <RadioGroup.Root
                            flexGrow={1}
                            value={(settings.enabled.new ?? settings.enabled.current ?? false) ? "true" : "false"}
                            onValueChange={(details) => {
                                setSettings({
                                    ...settings,
                                    enabled: { ...settings.enabled, new: details.value === "true" },
                                })
                            }}
                        >
                            <HStack gap={6} alignItems={"start"} w={"100%"}>
                                <RadioGroup.Item
                                    value="true"
                                    cursor={"pointer"}
                                    gap={0}
                                    bg={"pageBackground"}
                                    borderRadius={"full"}
                                    flexGrow={1}
                                >
                                    <RadioGroup.ItemHiddenInput />
                                    <Box
                                        w={"28px"}
                                        pl={"2px"}
                                        h={"100%"}
                                        display={"flex"}
                                        alignItems={"center"}
                                        justifyContent={"center"}
                                    >
                                        {(settings.enabled.new === true ||
                                            (settings.enabled.new === null && settings.enabled.current === true)) && (
                                            <FontAwesomeIcon icon={faArrowRight} />
                                        )}
                                    </Box>
                                    <RadioGroup.ItemText flexGrow={1}>
                                        <HStack
                                            bg={"lozenge.background.active"}
                                            px={2}
                                            py={1}
                                            borderRadius={"full"}
                                            border={"2px solid"}
                                            borderColor={"lozenge.border.active"}
                                            fontWeight={"bold"}
                                            fontSize={"sm"}
                                            w={"100%"}
                                            justifyContent={"center"}
                                        >
                                            <Text color={"lozenge.text.active"}>Active</Text>
                                        </HStack>
                                    </RadioGroup.ItemText>
                                </RadioGroup.Item>
                                <RadioGroup.Item
                                    value="false"
                                    cursor={"pointer"}
                                    gap={0}
                                    bg={"pageBackground"}
                                    borderRadius={"full"}
                                    flexGrow={1}
                                >
                                    <RadioGroup.ItemHiddenInput />
                                    <Box
                                        w={"28px"}
                                        pl={"2px"}
                                        h={"100%"}
                                        display={"flex"}
                                        alignItems={"center"}
                                        justifyContent={"center"}
                                    >
                                        {(settings.enabled.new === false ||
                                            (!settings.enabled.new && settings.enabled.current === false)) && (
                                            <FontAwesomeIcon icon={faArrowRight} />
                                        )}
                                    </Box>
                                    <RadioGroup.ItemText flexGrow={1}>
                                        <HStack
                                            bg={"lozenge.background.disabled"}
                                            px={2}
                                            py={1}
                                            borderRadius={"full"}
                                            border={"2px solid"}
                                            borderColor={"lozenge.border.disabled"}
                                            fontWeight={"bold"}
                                            fontSize={"sm"}
                                            w={"100%"}
                                            justifyContent={"center"}
                                        >
                                            <Text color={"lozenge.text.disabled"}>Disabled</Text>
                                        </HStack>
                                    </RadioGroup.ItemText>
                                </RadioGroup.Item>
                            </HStack>
                        </RadioGroup.Root>
                    </HStack>
                    {(settings.enabled.new === true ||
                        (settings.enabled.new === null && settings.enabled.current === true)) && (
                        <>
                            <HStack alignItems={"center"} gap={6} columnGap={6} rowGap={3} w={"100%"} flexWrap={"wrap"}>
                                <Text fontWeight={"bold"} minW={"120px"}>
                                    Max score
                                </Text>
                                <HStack w={{ base: "100%", sm: "auto" }}>
                                    <SingleLineTextInput
                                        bg={"pageBackground"}
                                        maxW={"60px"}
                                        h={"32px"}
                                        value={
                                            settings.maxValue.new?.toString() ??
                                            settings.maxValue.current?.toString() ??
                                            ""
                                        }
                                        onChange={(e) => {
                                            const value = e.target.value
                                            // Only allow digits
                                            if (!/^\d*$/.test(value)) return

                                            // Convert to number and validate range
                                            const numValue = value ? parseInt(value) : ""
                                            if (numValue === "" || (numValue >= 0 && numValue <= 100)) {
                                                setSettings({
                                                    ...settings,
                                                    maxValue: {
                                                        ...settings.maxValue,
                                                        new: numValue,
                                                    },
                                                })
                                            }
                                        }}
                                    />
                                    <Text>/ 100</Text>
                                    <ValidationErrorDisplay errors={validationErrors} field="maxValue" />
                                </HStack>
                            </HStack>
                            <HStack alignItems={"center"} gap={6} columnGap={6} rowGap={3} w={"100%"} flexWrap={"wrap"}>
                                <Text fontWeight={"bold"} minW={"120px"}>
                                    Previous days
                                </Text>
                                <RadioGroup.Root
                                    value={
                                        settings.previousDays.new?.toString() ??
                                        settings.previousDays.current?.toString() ??
                                        "30"
                                    }
                                    onValueChange={(details) => {
                                        setSettings({
                                            ...settings,
                                            previousDays: {
                                                ...settings.previousDays,
                                                new: parseInt(details.value),
                                            },
                                        })
                                    }}
                                >
                                    <HStack columnGap={6} rowGap={3} alignItems={"start"} flexWrap={"wrap"}>
                                        {[30, 60, 90].map((days) => (
                                            <RadioGroup.Item
                                                key={days}
                                                value={days.toString()}
                                                cursor={"pointer"}
                                                gap={0}
                                                bg={"pageBackground"}
                                                borderRadius={"full"}
                                                h={"32px"}
                                            >
                                                <RadioGroup.ItemHiddenInput />
                                                <Box
                                                    w={"28px"}
                                                    px={"2px"}
                                                    h={"100%"}
                                                    display={"flex"}
                                                    alignItems={"center"}
                                                    justifyContent={"center"}
                                                >
                                                    {(settings.previousDays.new === days ||
                                                        (!settings.previousDays.new &&
                                                            settings.previousDays.current === days)) && (
                                                        <FontAwesomeIcon icon={faArrowRight} />
                                                    )}
                                                </Box>
                                                <RadioGroup.ItemText>
                                                    <Text
                                                        whiteSpace={"nowrap"}
                                                        pr={2}
                                                        color={
                                                            settings.previousDays.new === days ||
                                                            (!settings.previousDays.new &&
                                                                settings.previousDays.current === days)
                                                                ? "textColor"
                                                                : "textColorMuted"
                                                        }
                                                    >
                                                        {days} days
                                                    </Text>
                                                </RadioGroup.ItemText>
                                            </RadioGroup.Item>
                                        ))}
                                    </HStack>
                                </RadioGroup.Root>
                            </HStack>
                            <HStack alignItems={"center"} gap={6} columnGap={6} rowGap={3} w={"100%"} flexWrap={"wrap"}>
                                <HStack gap={3}>
                                    <Text fontWeight={"bold"}>
                                        {signalStrength.displayName.replace(" Engagement", "")} URL
                                    </Text>
                                    <ValidationErrorDisplay errors={validationErrors} field="url" />
                                </HStack>
                                <SingleLineTextInput
                                    placeholder={"e.g. https://myforum.xyz"}
                                    bg={"pageBackground"}
                                    maxW={"100%"}
                                    h={"32px"}
                                    value={settings.url.new ?? settings.url.current ?? ""}
                                    onChange={(e) => {
                                        setSettings({
                                            ...settings,
                                            url: { ...settings.url, new: e.target.value },
                                        })
                                    }}
                                />
                            </HStack>
                            <VStack alignItems={"start"} gap={2} w={"100%"}>
                                <HStack gap={3}>
                                    <Text fontWeight={"bold"} minW={"120px"} whiteSpace={"nowrap"}>
                                        Authentication options
                                    </Text>
                                    <ValidationErrorDisplay errors={validationErrors} field="authTypes" />
                                </HStack>

                                <VStack alignItems={"start"} gap={3} w={"100%"}>
                                    {signalStrength.availableAuthTypes?.includes("api_auth") && (
                                        <VStack w={"100%"} alignItems={"start"} gap={1}>
                                            <AuthTypeSwitch
                                                key={"api_auth"}
                                                authType={"api_auth"}
                                                label={"Automatic ownership check"}
                                                settings={settings}
                                                setSettings={setSettings}
                                            />
                                            {(() => {
                                                const currentAuthTypes =
                                                    settings.authTypes.new ?? settings.authTypes.current ?? []
                                                if (currentAuthTypes.includes("api_auth")) {
                                                    return (
                                                        <Text fontSize={"sm"} pl={"58px"}>
                                                            Make sure you have enable user API keys (Link to docs)
                                                        </Text>
                                                    )
                                                }
                                                return null
                                            })()}
                                        </VStack>
                                    )}
                                    {signalStrength.availableAuthTypes?.includes("manual_post") && (
                                        <VStack w={"100%"} alignItems={"start"} gap={1}>
                                            <AuthTypeSwitch
                                                key={"manual_post"}
                                                authType={"manual_post"}
                                                label={"Post a public message"}
                                                settings={settings}
                                                setSettings={setSettings}
                                            />
                                            {(() => {
                                                const currentAuthTypes =
                                                    settings.authTypes.new ?? settings.authTypes.current ?? []
                                                if (currentAuthTypes.includes("manual_post")) {
                                                    return (
                                                        <VStack gap={1} w={"100%"} alignItems={"start"} pl={"58px"}>
                                                            <Text fontSize={"sm"}>
                                                                Set the URL of the page that users should post on to
                                                                confirm ownership
                                                            </Text>
                                                            <SingleLineTextInput
                                                                placeholder={"e.g. https://myforum.xyz/t/auth-posts/9"}
                                                                bg={"pageBackground"}
                                                                h={"32px"}
                                                                value={
                                                                    settings.authParentPostUrl.new ??
                                                                    settings.authParentPostUrl.current ??
                                                                    ""
                                                                }
                                                                onChange={(e) => {
                                                                    setSettings({
                                                                        ...settings,
                                                                        authParentPostUrl: {
                                                                            ...settings.authParentPostUrl,
                                                                            new: e.target.value,
                                                                        },
                                                                    })
                                                                }}
                                                            />
                                                            <ValidationErrorDisplay
                                                                errors={validationErrors}
                                                                field="authParentPostUrl"
                                                            />
                                                        </VStack>
                                                    )
                                                }
                                                return null
                                            })()}
                                        </VStack>
                                    )}
                                </VStack>
                            </VStack>
                        </>
                    )}
                    {hasChanges && (
                        <HStack w="100%" justify={"end"} gap={3}>
                            <Button secondaryButton px={3} py={1} borderRadius={"full"} onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button
                                primaryButton
                                px={3}
                                py={1}
                                borderRadius={"full"}
                                disabled={!hasChanges || validationErrors.length > 0}
                                onClick={handleSave}
                                loading={isSaving}
                            >
                                Save changes
                            </Button>
                        </HStack>
                    )}
                    {savingError && <Text color={"orange.500"}>{savingError}</Text>}
                    <Text>{JSON.stringify(settings)}</Text>
                </VStack>
            )}
        </VStack>
    )
}
