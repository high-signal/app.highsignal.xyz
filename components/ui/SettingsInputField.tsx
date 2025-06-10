"use client"

import { VStack, Text, HStack } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEarthAmericas, faLock } from "@fortawesome/free-solid-svg-icons"
import SingleLineTextInput from "./SingleLineTextInput"
import { ReactNode } from "react"

interface SettingsInputFieldProps {
    label: string
    labelIcon?: ReactNode
    description: string
    isPrivate: boolean
    value: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
    error?: string
    rightElement?: ReactNode
    isEditable?: boolean
    inputReplacement?: ReactNode
    h?: string
}

export default function SettingsInputField({
    label,
    labelIcon,
    description,
    isPrivate,
    value,
    onChange,
    onKeyDown,
    error,
    rightElement,
    isEditable = true,
    inputReplacement,
    h = "35px",
}: SettingsInputFieldProps) {
    return (
        <VStack align="stretch" w="100%">
            <HStack justify="space-between" px={2} pb={labelIcon ? "2px" : undefined}>
                <HStack>
                    {labelIcon}
                    <Text fontWeight="bold">{label}</Text>
                </HStack>
                <HStack fontSize="sm" color="gray.500" cursor="default" gap={1}>
                    <FontAwesomeIcon icon={isPrivate ? faLock : faEarthAmericas} />
                    <Text>{isPrivate ? "Private" : "Public"}</Text>
                </HStack>
            </HStack>
            <HStack w="100%" gap={0} bg={"pageBackground"} h={h}>
                {inputReplacement ? (
                    inputReplacement
                ) : (
                    <SingleLineTextInput
                        value={value}
                        onChange={onChange}
                        onKeyDown={onKeyDown}
                        rightElement={rightElement}
                        isEditable={isEditable}
                    />
                )}
                {rightElement}
            </HStack>
            {error ? (
                <Text color="orange.700" fontSize="sm" px={2}>
                    {error}
                </Text>
            ) : (
                <Text fontSize="sm" color="gray.500" px={2}>
                    {description}
                </Text>
            )}
        </VStack>
    )
}
