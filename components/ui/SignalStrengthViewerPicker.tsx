"use client"

import { HStack, Text, Box } from "@chakra-ui/react"
import { useState, useRef, useEffect } from "react"
import SingleLineTextInput from "./SingleLineTextInput"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronDown, faLinkSlash } from "@fortawesome/free-solid-svg-icons"

interface SignalStrengthViewerPickerProps {
    userSignalStrengths: SignalStrengthUserData[]
    onSelect: (item: SignalStrengthUserData) => void
}

export default function SignalStrengthViewerPicker({ userSignalStrengths, onSelect }: SignalStrengthViewerPickerProps) {
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null!)

    // On first render, set the search term to the first day of the user signal strengths
    useEffect(() => {
        if (!searchTerm && userSignalStrengths.length > 0) {
            setSearchTerm(userSignalStrengths[0].day)
        }
    }, [searchTerm, userSignalStrengths])

    return (
        <HStack
            position="relative"
            maxW={{ base: "100%", sm: "160px" }}
            flexGrow={1}
            fontFamily={"monospace"}
            gap={0}
            cursor={"pointer"}
        >
            <HStack w={"100%"} pointerEvents={isFocused ? "none" : "auto"}>
                <SingleLineTextInput
                    ref={inputRef}
                    placeholder="No data"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value)
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                        setTimeout(() => {
                            setIsFocused(false)
                        }, 50)
                    }}
                    bg="pageBackground"
                    isEditable={false}
                    isSelectorOnly
                />
                <Box
                    position="absolute"
                    right={4}
                    top={"50%"}
                    transform={"translateY(-50%)"}
                    fontSize={"lg"}
                    cursor={"pointer"}
                    pointerEvents="none"
                >
                    <FontAwesomeIcon icon={faChevronDown} />
                </Box>
            </HStack>
            {isFocused && (
                <Box
                    position="absolute"
                    top="100%"
                    left={0}
                    right={0}
                    mt={1}
                    bg="pageBackground"
                    borderWidth={3}
                    borderColor="contentBorder"
                    borderRadius="16px"
                    boxShadow="md"
                    zIndex={5}
                    maxH="200px"
                    overflowY="auto"
                    w={{ base: "100%", sm: "350px" }}
                >
                    {userSignalStrengths.map((signalStrengthEntry) => (
                        <Box
                            key={signalStrengthEntry.id}
                            px={2}
                            py={1}
                            cursor="pointer"
                            _hover={{ bg: "contentBackground" }}
                            onMouseDown={(e) => {
                                e.preventDefault()
                                setSearchTerm(signalStrengthEntry.day)
                                setIsFocused(false)
                                inputRef.current?.blur()
                                onSelect(signalStrengthEntry)
                            }}
                        >
                            <HStack
                                fontFamily={"monospace"}
                                fontSize={"17px"}
                                gap={2}
                                justifyContent={"space-between"}
                                fontWeight={signalStrengthEntry.day === searchTerm ? "bold" : "normal"}
                            >
                                <HStack gap={3}>
                                    <Text>{signalStrengthEntry.day}</Text>
                                    <HStack w={"50px"} justifyContent={"center"}>
                                        {(() => {
                                            const value = signalStrengthEntry.value || signalStrengthEntry.rawValue

                                            let display
                                            let color
                                            let bg
                                            let fontSize
                                            if (value === null || value === undefined) {
                                                return (
                                                    <Box color="textColorMuted">
                                                        <FontAwesomeIcon icon={faLinkSlash} fontSize="xs" />
                                                    </Box>
                                                )
                                            } else if (Number(value) == 0) {
                                                display = value
                                                color = "lozenge.text.disabled"
                                                bg = "lozenge.background.disabled"
                                            } else {
                                                display = value
                                                color = "lozenge.text.active"
                                                bg = "lozenge.background.active"
                                            }

                                            return (
                                                <Text
                                                    bg={bg}
                                                    color={color}
                                                    px={2}
                                                    py={0}
                                                    mx={1}
                                                    borderRadius={"10px"}
                                                    fontSize={fontSize || undefined}
                                                >
                                                    {display}
                                                </Text>
                                            )
                                        })()}
                                    </HStack>
                                    {signalStrengthEntry.day === searchTerm ? <Text pt={"3px"}>👀</Text> : null}
                                </HStack>
                                <Text fontSize={"sm"}>(ID {signalStrengthEntry.id})</Text>
                            </HStack>
                        </Box>
                    ))}
                </Box>
            )}
        </HStack>
    )
}
