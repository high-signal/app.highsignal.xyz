import { Box, Input } from "@chakra-ui/react"
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { ReactNode } from "react"

interface SingleLineTextInputProps {
    value: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
    handleClear?: () => void
    placeholder?: string
    rightElement?: ReactNode
    isEditable?: boolean
    ref?: React.RefObject<HTMLInputElement>
}

export default function SingleLineTextInput({
    value,
    onChange,
    onKeyDown,
    handleClear,
    onFocus,
    onBlur,
    placeholder = "",
    rightElement,
    isEditable = true,
    ref,
}: SingleLineTextInputProps) {
    const showClearButton = Boolean(handleClear) && Boolean(value)

    return (
        <Box position="relative" w="100%">
            <Input
                ref={ref}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder={placeholder}
                type="text"
                fontSize="md"
                borderRadius="full"
                borderRightRadius={rightElement ? "none" : "full"}
                border={"2px solid"}
                borderColor="gray.800"
                _focus={{
                    borderColor: isEditable ? "gray.300" : "gray.800",
                    boxShadow: "none",
                    outline: "none",
                }}
                _selection={{
                    bg: "gray.600",
                }}
                bg={value && isEditable ? "gray.800" : "pageBackground"}
                pr={showClearButton ? "30px" : "0px"}
                h="35px"
                readOnly={!isEditable}
                cursor={isEditable ? "text" : "disabled"}
                userSelect={isEditable ? "text" : "none"}
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
