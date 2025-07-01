"use client"

import { VStack, Text, HStack } from "@chakra-ui/react"
import SingleLineTextInput from "./SingleLineTextInput"
import { ReactNode } from "react"
import { Lozenges } from "./Lozenges"

interface SettingsInputFieldProps {
    label: string
    labelIcon?: ReactNode
    description: string
    value: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
    error?: string
    rightElement?: ReactNode
    isEditable?: boolean
    inputReplacement?: ReactNode
    h?: string
    lozengeTypes?: LozengeType[]
}

export default function SettingsInputField({
    label,
    labelIcon,
    description,
    value,
    onChange,
    onKeyDown,
    error,
    rightElement,
    isEditable = true,
    inputReplacement,
    h = "35px",
    lozengeTypes = [],
}: SettingsInputFieldProps) {
    return (
        <VStack
            align="stretch"
            w="100%"
            border="2px solid"
            borderColor="contentBorder"
            borderRadius="16px"
            p={3}
            bg={"pageBackground"}
            gap={1}
        >
            <HStack justify="space-between" alignItems="start" px={2} pb={labelIcon ? 2 : 1} gap={2}>
                <HStack>
                    {labelIcon}
                    <Text fontWeight="bold">{label}</Text>
                </HStack>
                <Lozenges types={lozengeTypes} />
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
                description && (
                    <Text fontSize="sm" color="gray.500" px={2}>
                        {description}
                    </Text>
                )
            )}
        </VStack>
    )
}
