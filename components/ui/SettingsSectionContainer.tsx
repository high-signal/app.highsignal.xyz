"use client"

import { VStack } from "@chakra-ui/react"

interface SettingsSectionContainerProps {
    maxWidth?: string
    px?: { [key: string]: number }
    py?: { [key: string]: number }
    gap?: number
    children: React.ReactNode
}

export default function SettingsSectionContainer({
    maxWidth = "500px",
    px = { base: 0, sm: 0 },
    py = { base: 4, sm: 4 },
    gap = 6,
    children,
}: SettingsSectionContainerProps) {
    return (
        <VStack gap={gap} w="100%" maxW={maxWidth} mx="auto" px={px} py={py}>
            {children}
        </VStack>
    )
}
