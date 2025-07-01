import { HStack, VStack, Text } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { IconProp } from "@fortawesome/fontawesome-svg-core"

export default function SettingsGroupContainer({
    title,
    icon,
    children,
}: {
    icon: IconProp
    title: string
    children: React.ReactNode
}) {
    return (
        <VStack w="100%" bg="contentBackground" borderRadius="16px" px={3} py={4} gap={4} alignItems="start">
            <HStack fontWeight="bold" fontSize="lg" pl={3} gap={2}>
                <FontAwesomeIcon icon={icon} size="lg" />
                <Text>{title}</Text>
            </HStack>
            <VStack w={"100%"} gap={4}>
                {children}
            </VStack>
        </VStack>
    )
}
