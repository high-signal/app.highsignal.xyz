import { HStack, Text, Switch, VStack, Box, Textarea, NativeSelect, Button } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronRight } from "@fortawesome/free-solid-svg-icons"
import { useState } from "react"
import SingleLineTextInput from "../ui/SingleLineTextInput"

import SignalStrength from "../signal-display/signal-strength/SignalStrength"

export default function SignalStrengthSettings({ signalStrength }: { signalStrength: SignalStrengthProjectData }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <VStack w="100%" gap={0}>
            <HStack
                justify="space-between"
                w="500px"
                maxW={"100%"}
                bg={"contentBackground"}
                p={4}
                borderRadius={"16px"}
                borderBottomRadius={isOpen ? "0px" : "16px"}
                flexWrap={"wrap"}
            >
                <HStack w={"250px"}>
                    <HStack
                        cursor={signalStrength.status !== "dev" ? "pointer" : "disabled"}
                        onClick={() => signalStrength.status !== "dev" && setIsOpen(!isOpen)}
                        _hover={signalStrength.status !== "dev" ? { bg: "gray.800" } : undefined}
                        py={2}
                        px={3}
                        borderRadius={"8px"}
                        gap={3}
                    >
                        <Box transition="transform 0.2s" transform={`rotate(${isOpen ? 90 : 0}deg)`}>
                            <FontAwesomeIcon icon={faChevronRight} />
                        </Box>
                        <Text
                            w="fit-content"
                            fontWeight="bold"
                            fontSize="lg"
                            whiteSpace="nowrap"
                            color={signalStrength.status === "dev" ? "textColor" : undefined}
                        >
                            {signalStrength.displayName}
                        </Text>
                    </HStack>
                </HStack>
                {signalStrength.status !== "dev" && signalStrength.enabled ? (
                    <HStack justifyContent="start" w="100px">
                        <SingleLineTextInput
                            value={signalStrength.maxValue.toString()}
                            onChange={() => {}}
                            onKeyDown={() => {}}
                            isEditable={true}
                        />
                        <Text whiteSpace="nowrap">/ 100</Text>
                    </HStack>
                ) : (
                    <Text>Coming soon 🏗️</Text>
                )}
                <Switch.Root
                    defaultChecked={signalStrength.status === "active" && signalStrength.enabled}
                    disabled={signalStrength.status != "active"}
                >
                    <Switch.HiddenInput />
                    <Switch.Control>
                        <Switch.Thumb />
                    </Switch.Control>
                    <Switch.Label />
                </Switch.Root>
            </HStack>
            {isOpen && (
                <VStack w="100%" pb={2} gap={0}>
                    {/* Prompt Options */}
                    <VStack w={"500px"} maxW={"100%"} bg={"contentBackground"} alignItems={"start"} gap={2} px={3}>
                        <Text px={2}>Prompt</Text>
                        <Textarea placeholder="Prompt" borderRadius={"10px"} borderWidth={2} />
                    </VStack>
                    {/* Testing Options */}
                    <HStack w={"500px"} maxW={"100%"} bg={"contentBackground"} alignItems={"center"} px={3} py={5}>
                        <NativeSelect.Root size="sm" width="fit-content">
                            <NativeSelect.Field placeholder="Select test user">
                                <option value="react">React</option>
                                <option value="vue">Vue</option>
                                <option value="angular">Angular</option>
                                <option value="svelte">Svelte</option>
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                        </NativeSelect.Root>
                        <Button>
                            <Text>Test</Text>
                        </Button>
                        <Text>{"->"}</Text>
                        <Button>
                            <Text>Save</Text>
                        </Button>
                    </HStack>
                    {/* Testing Output  */}
                    <VStack
                        w={"100%"}
                        bg={"contentBackground"}
                        borderRadius={"16px"}
                        borderTopRadius={{ base: "0px", md: "16px" }}
                        alignItems={"center"}
                        gap={2}
                        pt={5}
                    >
                        <HStack w={"100%"} justifyContent={"space-around"} flexWrap={"wrap"}>
                            <VStack w={"100%"} maxW={"600px"} gap={2} borderRadius={"16px"}>
                                <Box w={"100%"} px={3}>
                                    <Text
                                        w={"100%"}
                                        py={2}
                                        textAlign={"center"}
                                        bg={"gray.800"}
                                        borderRadius={"full"}
                                        fontWeight={"bold"}
                                    >
                                        Current Result
                                    </Text>
                                </Box>
                                <SignalStrength
                                    username={"test"}
                                    userData={{
                                        value: "30",
                                        description: "current description",
                                        improvements: "current improvements",
                                        name: "test",
                                        summary: "current summary",
                                    }}
                                    projectData={{
                                        maxValue: 100,
                                        name: "test",
                                        displayName: `${signalStrength.displayName}`,
                                        status: "active",
                                        enabled: true,
                                        previousDays: 10,
                                    }}
                                    isUserConnected={true}
                                    refreshUserData={() => {}}
                                />
                            </VStack>
                            <VStack w={"100%"} maxW={"600px"} gap={2}>
                                <Box w={"100%"} px={3}>
                                    <Text
                                        w={"100%"}
                                        py={2}
                                        textAlign={"center"}
                                        bg={"blue.500"}
                                        borderRadius={"full"}
                                        fontWeight={"bold"}
                                    >
                                        Testing Result
                                    </Text>
                                </Box>
                                <SignalStrength
                                    username={"test"}
                                    userData={{
                                        value: "70",
                                        description: "new description",
                                        improvements: "new improvements",
                                        name: "test",
                                        summary: "new summary",
                                    }}
                                    projectData={{
                                        maxValue: 100,
                                        name: "test",
                                        displayName: `${signalStrength.displayName}`,
                                        status: "active",
                                        enabled: true,
                                        previousDays: 10,
                                    }}
                                    isUserConnected={true}
                                    refreshUserData={() => {}}
                                />
                            </VStack>
                        </HStack>
                    </VStack>
                </VStack>
            )}
        </VStack>
    )
}
