"use client"

import { VStack, Text, HStack } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEarthAmericas, faLock } from "@fortawesome/free-solid-svg-icons"
import SingleLineTextInput from "../ui/SingleLineTextInput"

interface SettingsInputFieldProps {
    label: string
    description: string
    isPrivate: boolean
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    error: string
}

export default function SettingsInputField({
    label,
    description,
    isPrivate,
    value,
    onChange,
    error,
}: SettingsInputFieldProps) {
    return (
        <VStack align="stretch" w="100%">
            <HStack justify="space-between" px={2}>
                <Text fontWeight="bold">{label}</Text>
                <HStack fontSize="sm" color="gray.500">
                    <FontAwesomeIcon icon={isPrivate ? faLock : faEarthAmericas} />
                    <Text>{isPrivate ? "Private" : "Public"}</Text>
                </HStack>
            </HStack>
            <SingleLineTextInput value={value} onChange={onChange} />
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
