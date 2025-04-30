import { VStack, Text } from "@chakra-ui/react"

interface SettingsSectionContainerProps {
    children: React.ReactNode
    maxWidth?: string
}

export default function SettingsSectionContainer({ maxWidth = "500px", children }: SettingsSectionContainerProps) {
    return (
        <VStack gap={6} w="100%" maxW={maxWidth} mx="auto" p={4}>
            {children}
        </VStack>
    )
}
