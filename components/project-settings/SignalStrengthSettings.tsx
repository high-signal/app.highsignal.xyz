import { HStack, Text, VStack, Box, Switch, Button, Span, RadioGroup } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowRight, faCheck, faChevronRight } from "@fortawesome/free-solid-svg-icons"
import { useEffect, useState } from "react"
import SingleLineTextInput from "../ui/SingleLineTextInput"

type SignalStrengthState = {
    status: { current: string | null; new: string | null }
    maxValue: { current: number | null; new: number | string | null }
    previousDays: { current: number | null; new: number | string | null }
    url: { current: string | null; new: string | null }
    authTypes: { current: string[] | null; new: string[] | null }
    authParentPostUrl: { current: string | null; new: string | null }
}

interface AuthTypeSwitchProps {
    authType: string
    settings: SignalStrengthState
    setSettings: (settings: SignalStrengthState) => void
}

function AuthTypeSwitch({ authType, settings, setSettings }: AuthTypeSwitchProps) {
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
            <Switch.Label>{authType.replace("_", " ").toUpperCase()}</Switch.Label>
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
    const [isOpen, setIsOpen] = useState(true)
    const [settings, setSettings] = useState<SignalStrengthState>({
        status: {
            current: signalStrength.status,
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

    useEffect(() => {
        const hasChanges = Object.values(settings).some((setting) => setting.new !== null)
        setHasChanges(hasChanges)
    }, [settings])

    const handleCancel = () => {
        const resetSettings = Object.keys(settings).reduce(
            (acc, key) => ({
                ...acc,
                [key]: { ...settings[key as keyof SignalStrengthState], new: null },
            }),
            {} as SignalStrengthState,
        )
        setSettings(resetSettings)
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
                            signalStrength.status === "dev"
                                ? "lozenge.background.disabled"
                                : "lozenge.background.active"
                        }
                        px={2}
                        py={1}
                        borderRadius={"full"}
                        border={"2px solid"}
                        borderColor={
                            signalStrength.status === "dev" ? "lozenge.border.disabled" : "lozenge.border.active"
                        }
                        fontWeight={"bold"}
                        fontSize={"sm"}
                    >
                        <Text color={signalStrength.status === "dev" ? "lozenge.text.disabled" : "lozenge.text.active"}>
                            {signalStrength.status === "dev" ? "Coming soon 🏗️" : "Active"}
                        </Text>
                    </HStack>
                </HStack>
            </HStack>
            {isOpen && (
                <VStack
                    w="100%"
                    pb={2}
                    gap={5}
                    bg={"contentBackground"}
                    p={4}
                    borderRadius={{ base: "0px", md: "16px" }}
                    alignItems={"start"}
                >
                    <HStack alignItems={"center"} columnGap={6} rowGap={3} w={"100%"} flexWrap={"wrap"}>
                        <Text fontWeight={"bold"} minW={"120px"}>
                            Status
                        </Text>
                        <RadioGroup.Root
                            value={settings.status.new ?? settings.status.current ?? "disabled"}
                            onValueChange={(details) => {
                                setSettings({
                                    ...settings,
                                    status: { ...settings.status, new: details.value },
                                })
                            }}
                        >
                            <HStack gap={6} alignItems={"start"}>
                                <RadioGroup.Item
                                    value="active"
                                    cursor={"pointer"}
                                    gap={0}
                                    bg={"pageBackground"}
                                    borderRadius={"full"}
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
                                        {(settings.status.new === "active" ||
                                            (!settings.status.new && settings.status.current === "active")) && (
                                            <FontAwesomeIcon icon={faArrowRight} />
                                        )}
                                    </Box>
                                    <RadioGroup.ItemText>
                                        <HStack
                                            bg={"lozenge.background.active"}
                                            px={2}
                                            py={1}
                                            borderRadius={"full"}
                                            border={"2px solid"}
                                            borderColor={"lozenge.border.active"}
                                            fontWeight={"bold"}
                                            fontSize={"sm"}
                                        >
                                            <Text color={"lozenge.text.active"}>Active</Text>
                                        </HStack>
                                    </RadioGroup.ItemText>
                                </RadioGroup.Item>
                                <RadioGroup.Item
                                    value="disabled"
                                    cursor={"pointer"}
                                    gap={0}
                                    bg={"pageBackground"}
                                    borderRadius={"full"}
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
                                        {(settings.status.new === "disabled" ||
                                            (!settings.status.new && settings.status.current === "disabled")) && (
                                            <FontAwesomeIcon icon={faArrowRight} />
                                        )}
                                    </Box>
                                    <RadioGroup.ItemText>
                                        <HStack
                                            bg={"lozenge.background.disabled"}
                                            px={2}
                                            py={1}
                                            borderRadius={"full"}
                                            border={"2px solid"}
                                            borderColor={"lozenge.border.disabled"}
                                            fontWeight={"bold"}
                                            fontSize={"sm"}
                                        >
                                            <Text color={"lozenge.text.disabled"}>Disabled</Text>
                                        </HStack>
                                    </RadioGroup.ItemText>
                                </RadioGroup.Item>
                            </HStack>
                        </RadioGroup.Root>
                    </HStack>
                    <HStack alignItems={"center"} gap={6} columnGap={6} rowGap={3} w={"100%"} flexWrap={"wrap"}>
                        <Text fontWeight={"bold"} minW={"120px"}>
                            Max score
                        </Text>
                        <HStack w={{ base: "100%", sm: "auto" }}>
                            <SingleLineTextInput
                                bg={"pageBackground"}
                                maxW={"60px"}
                                h={"32px"}
                                value={settings.maxValue.new?.toString() ?? settings.maxValue.current?.toString() ?? ""}
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
                                    previousDays: { ...settings.previousDays, new: parseInt(details.value) },
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
                        <Text fontWeight={"bold"} minW={"120px"}>
                            URL
                        </Text>
                        <SingleLineTextInput
                            bg={"pageBackground"}
                            maxW={"400px"}
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
                        <Text fontWeight={"bold"} minW={"120px"}>
                            Authentication options
                        </Text>

                        <VStack alignItems={"start"} gap={3} w={"100%"}>
                            {signalStrength.availableAuthTypes?.includes("api_auth") && (
                                <HStack columnGap={6} rowGap={3} w={"100%"} flexWrap={"wrap"}>
                                    <AuthTypeSwitch
                                        key={"api_auth"}
                                        authType={"api_auth"}
                                        settings={settings}
                                        setSettings={setSettings}
                                    />
                                    {(() => {
                                        const currentAuthTypes =
                                            settings.authTypes.new ?? settings.authTypes.current ?? []
                                        if (currentAuthTypes.includes("api_auth")) {
                                            return (
                                                <Text fontSize={"sm"} h={"20px"}>
                                                    Make sure you have enable user API keys
                                                </Text>
                                            )
                                        }
                                        return null
                                    })()}
                                </HStack>
                            )}
                            {signalStrength.availableAuthTypes?.includes("manual_post") && (
                                <AuthTypeSwitch
                                    key={"manual_post"}
                                    authType={"manual_post"}
                                    settings={settings}
                                    setSettings={setSettings}
                                />
                            )}
                            {(() => {
                                const currentAuthTypes = settings.authTypes.new ?? settings.authTypes.current ?? []
                                if (currentAuthTypes.includes("manual_post")) {
                                    return <Text>Auth parent post URL: {signalStrength.authParentPostUrl}</Text>
                                }
                                return null
                            })()}
                        </VStack>
                    </VStack>
                    {hasChanges && (
                        <HStack w="100%" justify={"end"} gap={3}>
                            <Button secondaryButton px={3} py={1} borderRadius={"full"} onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button primaryButton px={3} py={1} borderRadius={"full"}>
                                Save changes
                            </Button>
                        </HStack>
                    )}
                    <Text>{JSON.stringify(settings)}</Text>
                </VStack>
            )}
        </VStack>
    )
}
