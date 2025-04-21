"use client"

import { VStack, Text, HStack } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEarthAmericas, faLock } from "@fortawesome/free-solid-svg-icons"
import SingleLineTextInput from "../ui/SingleLineTextInput"
import { ReactNode } from "react"

interface SettingsInputFieldProps {
    label: string
    description: string
    isPrivate: boolean
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
    error?: string
    rightElement?: ReactNode
}

export default function SettingsInputField({
    label,
    description,
    isPrivate,
    value,
    onChange,
    onKeyDown,
    error,
    rightElement,
}: SettingsInputFieldProps) {
    return (
        <VStack align="stretch" w="100%">
            <HStack justify="space-between" px={2}>
                <Text fontWeight="bold">{label}</Text>
                <HStack fontSize="sm" color="gray.500" cursor="default" gap={1}>
                    <FontAwesomeIcon icon={isPrivate ? faLock : faEarthAmericas} />
                    <Text>{isPrivate ? "Private" : "Public"}</Text>
                </HStack>
            </HStack>
            <HStack w="100%" gap={0}>
                <SingleLineTextInput
                    value={value}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    rightElement={rightElement}
                />
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
