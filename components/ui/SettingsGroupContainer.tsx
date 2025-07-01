import { HStack, VStack, Text } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { Lozenges } from "./Lozenges"

export default function SettingsGroupContainer({
    title,
    icon,
    children,
    lozengeTypes,
}: {
    icon: IconProp
    title: string
    children: React.ReactNode
    lozengeTypes?: LozengeType[]
}) {
    return (
        <VStack w="100%" bg="contentBackground" borderRadius="16px" px={3} py={4} gap={4} alignItems="start">
            <HStack>
                <HStack fontWeight="bold" fontSize="lg" pl={3} gap={2}>
                    <FontAwesomeIcon icon={icon} size="lg" />
                    <Text>{title}</Text>
                </HStack>
                {lozengeTypes && <Lozenges types={lozengeTypes} />}
            </HStack>
            <VStack w={"100%"} gap={4}>
                {children}
            </VStack>
        </VStack>
    )
}
