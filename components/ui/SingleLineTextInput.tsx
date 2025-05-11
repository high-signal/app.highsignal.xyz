import { Box, Button, Input } from "@chakra-ui/react"
import { faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { ReactNode } from "react"

interface SingleLineTextInputProps {
    value: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
    handleClear?: () => void
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
    maxW?: string
    placeholder?: string
    rightElement?: ReactNode
    isEditable?: boolean
    ref?: React.RefObject<HTMLInputElement>
    bg?: string
}

export default function SingleLineTextInput({
    value,
    onChange,
    onKeyDown,
    handleClear,
    onFocus,
    onBlur,
    maxW = "100%",
    placeholder = "",
    rightElement,
    isEditable = true,
    ref,
    bg = "contentBackground",
}: SingleLineTextInputProps) {
    const showClearButton = Boolean(handleClear) && Boolean(value)

    return (
        <Box position="relative" w="100%" maxW={maxW}>
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
                border={"3px solid"}
                borderColor="transparent"
                _focus={{
                    borderColor: isEditable ? "input.border" : "transparent",
                    boxShadow: "none",
                    outline: "none",
                }}
                bg={bg}
                pr={showClearButton ? "30px" : "0px"}
                h="35px"
                readOnly={!isEditable}
                cursor={isEditable ? "text" : "disabled"}
                userSelect={isEditable ? "text" : "none"}
                color="textColor"
            />
            {showClearButton && (
                <Button
                    closeButton
                    position="absolute"
                    right="8px"
                    top="50%"
                    transform="translateY(-52%)"
                    onClick={handleClear}
                    borderRadius="full"
                    color={bg}
                    w="20px"
                    h="20px"
                    minW="20px"
                    maxW="20px"
                    justifyContent={"center"}
                    alignItems={"center"}
                    display="flex"
                >
                    <FontAwesomeIcon icon={faXmark} />
                </Button>
            )}
        </Box>
    )
}
