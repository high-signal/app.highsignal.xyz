import { VStack, Text } from "@chakra-ui/react"

interface SettingsSectionContainerProps {
    title: string
    children: React.ReactNode
    maxWidth?: string
}

export default function SettingsSectionContainer({
    title,
    maxWidth = "500px",
    children,
}: SettingsSectionContainerProps) {
    return (
        <VStack gap={6} w="100%" maxW={maxWidth} mx="auto" p={4}>
            <Text fontSize="2xl" fontWeight="bold">
                {title}
            </Text>
            {children}
        </VStack>
    )
}
