"use client"

import { HStack, Text, Box } from "@chakra-ui/react"
import { useState, useRef, useEffect } from "react"
import SingleLineTextInput from "./SingleLineTextInput"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronDown } from "@fortawesome/free-solid-svg-icons"

interface SignalStrengthPromptPickerProps {
    prompts: Prompt[]
    onSelect: (item: Prompt) => void
}

export default function SignalStrengthPromptPicker({ prompts, onSelect }: SignalStrengthPromptPickerProps) {
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null!)

    // On first render, set the search term to the latest prompt
    useEffect(() => {
        if (!searchTerm && prompts.length > 0) {
            setSearchTerm(`${prompts[0].created_at.split("T")[0]} (ID ${prompts[0].id})`)
        }
    }, [searchTerm, prompts])

    return (
        <HStack
            position="relative"
            maxW={{ base: "100%", sm: "230px" }}
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
                    w={{ base: "100%", sm: "230px" }}
                >
                    {prompts.map((prompt: Prompt) => (
                        <Box
                            key={prompt.id}
                            px={2}
                            py={1}
                            cursor="pointer"
                            _hover={{ bg: "contentBackground" }}
                            onMouseDown={(e) => {
                                e.preventDefault()
                                setSearchTerm(`${prompt.created_at.split("T")[0]} (ID ${prompt.id})`)
                                setIsFocused(false)
                                inputRef.current?.blur()
                                onSelect(prompt)
                            }}
                        >
                            <HStack
                                fontFamily={"monospace"}
                                fontSize={"17px"}
                                gap={2}
                                justifyContent={"start"}
                                alignItems={"center"}
                                fontWeight={
                                    prompt.id.toString() === searchTerm.split(" ")[2].replace(")", "")
                                        ? "bold"
                                        : "normal"
                                }
                            >
                                <Text>{prompt.created_at.split("T")[0]}</Text>
                                <Text fontSize={"15px"}>(ID {prompt.id})</Text>
                                {prompt.id.toString() === searchTerm.split(" ")[2].replace(")", "") ? (
                                    <Text pl={2} pt={"3px"}>
                                        👀
                                    </Text>
                                ) : null}
                            </HStack>
                        </Box>
                    ))}
                </Box>
            )}
        </HStack>
    )
}
