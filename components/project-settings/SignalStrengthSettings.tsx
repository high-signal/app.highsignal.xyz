import { HStack, Text, Switch, VStack, Box, Textarea, NativeSelect, Button } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronRight } from "@fortawesome/free-solid-svg-icons"
import { useState } from "react"
import SingleLineTextInput from "../ui/SingleLineTextInput"

import SignalStrength from "../signal-display/signal-strength/SignalStrength"

interface SignalStrengthRowProps {
    title: string
    value: string
    onChange: () => void
    onKeyDown: () => void
    isEnabled?: boolean
    status: string
}

export default function SignalStrengthSettings({
    title,
    value,
    onChange,
    onKeyDown,
    isEnabled = true,
    status,
}: SignalStrengthRowProps) {
    const [isOpen, setIsOpen] = useState(true)

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
                        cursor="pointer"
                        onClick={() => setIsOpen(!isOpen)}
                        _hover={{ bg: "gray.800" }}
                        py={2}
                        px={3}
                        borderRadius={"8px"}
                        gap={3}
                    >
                        <Box transition="transform 0.2s" transform={`rotate(${isOpen ? 90 : 0}deg)`}>
                            <FontAwesomeIcon icon={faChevronRight} />
                        </Box>
                        <Text w="fit-content" fontWeight="bold" fontSize="lg" whiteSpace="nowrap">
                            {title}
                        </Text>
                    </HStack>
                </HStack>
                <HStack justifyContent="start" w="100px">
                    <SingleLineTextInput value={value} onChange={onChange} onKeyDown={onKeyDown} isEditable={true} />
                    <Text whiteSpace="nowrap">/ 100</Text>
                </HStack>
                <Switch.Root defaultChecked={isEnabled} disabled={status != "active"}>
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
                        <Text>Prompt Options</Text>
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
                                        displayName: `${title}`,
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
                                        displayName: `${title}`,
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
