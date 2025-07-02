import { VStack } from "@chakra-ui/react"

interface SettingsSectionContainerProps {
    maxWidth?: string
    px?: { [key: string]: number }
    children: React.ReactNode
}

export default function SettingsSectionContainer({
    maxWidth = "500px",
    px = { base: 4, sm: 2 },
    children,
}: SettingsSectionContainerProps) {
    return (
        <VStack gap={6} w="100%" maxW={maxWidth} mx="auto" px={px} py={4}>
            {children}
        </VStack>
    )
}
