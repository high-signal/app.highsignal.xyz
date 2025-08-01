"use client"

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
        <VStack
            w="100%"
            bg="contentBackground"
            borderRadius={{ base: "0px", sm: "16px" }}
            px={{ base: 0, sm: 3 }}
            py={4}
            gap={4}
            alignItems="start"
        >
            <HStack w="100%" justifyContent="space-between" px={{ base: 5, sm: 3 }}>
                <HStack fontWeight="bold" fontSize="lg" gap={2}>
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
