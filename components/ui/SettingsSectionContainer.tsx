import { VStack, Text } from "@chakra-ui/react"

interface SettingsSectionContainerProps {
    maxWidth?: string
    px?: number | { [key: string]: number }
    children: React.ReactNode
}

export default function SettingsSectionContainer({
    maxWidth = "500px",
    px = 4,
    children,
}: SettingsSectionContainerProps) {
    return (
        <VStack gap={6} w="100%" maxW={maxWidth} mx="auto" px={px} py={4}>
            {children}
        </VStack>
    )
}
