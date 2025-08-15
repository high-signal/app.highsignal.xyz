"use client"

import { VStack, Text } from "@chakra-ui/react"
import { useState } from "react"
import ModalCloseButton from "../ModalCloseButton"

export default function HeaderBanner({ banner }: { banner: BannerProps }) {
    const [isVisible, setIsVisible] = useState(true)

    if (!isVisible) {
        return null
    }

    const isClosable = banner.closable

    return (
        <VStack w="100dvw" bg="contentBackground" pt={1} pb={2} gap={1} zIndex={1} textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" px={isClosable ? 10 : 3}>
                {banner.title}
            </Text>
            <Text px={3}>{banner.content}</Text>
            {isClosable && <ModalCloseButton onClose={() => setIsVisible(false)} noRadius />}
        </VStack>
    )
}
