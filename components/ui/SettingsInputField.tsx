"use client"

import { VStack, Text, HStack, Button } from "@chakra-ui/react"
import SingleLineTextInput from "./SingleLineTextInput"
import { ReactNode } from "react"
import { Lozenges } from "./Lozenges"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPencil } from "@fortawesome/free-solid-svg-icons"

interface SettingsInputFieldProps {
    label: string
    labelIcon?: ReactNode
    description?: string | ReactNode
    value: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
    error?: string
    rightElement?: ReactNode
    isEditable?: boolean
    inputReplacement?: ReactNode
    h?: string
    lozengeTypes?: LozengeType[]
    valueFontFamily?: string
    onEditButton?: () => void
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
    valueFontFamily,
    onEditButton,
}: SettingsInputFieldProps) {
    return (
        <VStack
            align="stretch"
            w="100%"
            border="2px solid"
            borderColor="contentBorder"
            borderRadius={{ base: "0px", sm: "16px" }}
            borderLeftWidth={{ base: "0px", sm: "2px" }}
            borderRightWidth={{ base: "0px", sm: "2px" }}
            p={3}
            bg={"pageBackground"}
            gap={1}
        >
            <HStack justify="space-between" alignItems="start" px={2} pb={labelIcon ? 2 : 1} gap={2} flexWrap="wrap">
                <HStack>
                    {labelIcon}
                    <Text fontWeight="bold">{label}</Text>
                </HStack>
                <HStack>
                    {onEditButton && (
                        <Button
                            secondaryButton
                            pl={2}
                            pr={3}
                            py={"2px"}
                            h={"23px"}
                            borderRadius="full"
                            onClick={onEditButton}
                        >
                            <HStack gap={1}>
                                <FontAwesomeIcon icon={faPencil} />
                                <Text whiteSpace="wrap">Edit</Text>
                            </HStack>
                        </Button>
                    )}
                    <Lozenges types={lozengeTypes} />
                </HStack>
            </HStack>
            <HStack w="100%" gap={0} bg={"pageBackground"} h={h}>
                {inputReplacement ? (
                    inputReplacement
                ) : (
                    <SingleLineTextInput
                        value={value}
                        valueFontFamily={valueFontFamily}
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
            ) : description ? (
                typeof description === "string" ? (
                    <Text fontSize="sm" color="gray.500" px={2}>
                        {description}
                    </Text>
                ) : (
                    description
                )
            ) : null}
        </VStack>
    )
}
