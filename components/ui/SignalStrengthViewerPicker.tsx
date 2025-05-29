import { HStack, Text, Box } from "@chakra-ui/react"
import { useState, useRef, useEffect } from "react"
import SingleLineTextInput from "./SingleLineTextInput"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faLinkSlash } from "@fortawesome/free-solid-svg-icons"

interface SignalStrengthViewerPickerProps {
    userSignalStrengths: SignalStrengthUserData[]
    onSelect: (item: SignalStrengthUserData) => void
}

export default function SignalStrengthViewerPicker({ userSignalStrengths, onSelect }: SignalStrengthViewerPickerProps) {
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null!)

    useEffect(() => {
        if (userSignalStrengths.length > 0) {
            setSearchTerm(userSignalStrengths[0].day)
        }
    }, [userSignalStrengths])

    return (
        <Box position="relative" maxW={{ base: "100%", sm: "130px" }} flexGrow={1} fontFamily={"monospace"}>
            <SingleLineTextInput
                ref={inputRef}
                placeholder="Select a signal strength viewer..."
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
                    w={{ base: "100%", sm: "280px" }}
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
                            <HStack fontFamily={"monospace"} fontSize={"17px"} gap={2} justifyContent={"space-between"}>
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
                                </HStack>
                                <Text fontSize={"sm"}>(ID {signalStrengthEntry.id})</Text>
                            </HStack>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    )
}
