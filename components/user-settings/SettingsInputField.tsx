"use client"

import { VStack, Text, Input, Button, HStack } from "@chakra-ui/react"

interface SettingsInputFieldProps {
    label: string
    description: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onSave: () => void
    error: string
    isChanged: boolean
    isLoading: boolean
}

export default function SettingsInputField({
    label,
    description,
    value,
    onChange,
    onSave,
    error,
    isChanged,
    isLoading,
}: SettingsInputFieldProps) {
    return (
        <VStack align="stretch" w="100%">
            <Text fontWeight="bold">{label}</Text>
            <HStack>
                <Input value={value} onChange={onChange} _invalid={{ borderColor: "red.300" }} />
                {isChanged && (
                    <Button colorScheme="blue" onClick={onSave} loading={isLoading} disabled={!!error}>
                        Save
                    </Button>
                )}
            </HStack>
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
