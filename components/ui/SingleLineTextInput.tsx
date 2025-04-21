import { Box, Input } from "@chakra-ui/react"
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { ReactNode } from "react"

interface SingleLineTextInputProps {
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
    handleClear?: () => void
    placeholder?: string
    rightElement?: ReactNode
}

export default function SingleLineTextInput({
    value,
    onChange,
    onKeyDown,
    handleClear,
    placeholder = "",
    rightElement,
}: SingleLineTextInputProps) {
    const showClearButton = Boolean(handleClear) && Boolean(value)

    return (
        <Box position="relative" w="100%">
            <Input
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                type="text"
                fontSize="md"
                borderRadius="full"
                borderRightRadius={rightElement ? "none" : "full"}
                border={"2px solid"}
                borderColor="gray.800"
                _focus={{
                    borderColor: "gray.300",
                    boxShadow: "none",
                    outline: "none",
                }}
                _selection={{
                    bg: "gray.600",
                    color: "white",
                }}
                bg={value ? "gray.800" : "transparent"}
                pr={showClearButton ? "30px" : "0px"}
                h="35px"
            />
            {showClearButton && (
                <Box
                    position="absolute"
                    right="6px"
                    top="50%"
                    transform="translateY(-50%)"
                    cursor="pointer"
                    onClick={handleClear}
                    color="gray.200"
                    _hover={{ color: "white" }}
                >
                    <FontAwesomeIcon icon={faCircleXmark} size="lg" />
                </Box>
            )}
        </Box>
    )
}
