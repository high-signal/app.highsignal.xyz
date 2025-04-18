"use client"

import { VStack, Text, Input, Button, HStack } from "@chakra-ui/react"

interface SettingsInputFieldProps {
    label: string
    description: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    error: string
}

export default function SettingsInputField({ label, description, value, onChange, error }: SettingsInputFieldProps) {
    return (
        <VStack align="stretch" w="100%">
            <Text fontWeight="bold">{label}</Text>
            <Input value={value} onChange={onChange} />
            {error ? (
                <Text color="orange.700" fontSize="sm">
                    {error}
                </Text>
            ) : (
                <Text fontSize="sm" color="gray.500">
                    {description}
                </Text>
            )}
        </VStack>
    )
}
