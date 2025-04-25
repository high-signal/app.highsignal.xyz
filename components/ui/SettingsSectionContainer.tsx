import { VStack, Text } from "@chakra-ui/react"

interface SettingsSectionContainerProps {
    title: string
    children: React.ReactNode
}

export default function SettingsSectionContainer({ title, children }: SettingsSectionContainerProps) {
    return (
        <VStack gap={6} w="100%" maxW="500px" mx="auto" p={4}>
            <Text fontSize="2xl" fontWeight="bold">
                {title}
            </Text>
            {children}
        </VStack>
    )
}
