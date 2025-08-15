"use client"

import { VStack, Text } from "@chakra-ui/react"
import ModalCloseButton from "../ModalCloseButton"
import { useBanner } from "../../../contexts/BannerContext"

export default function HeaderBanner({ banner, index }: { banner: BannerProps; index: number }) {
    const { hideHeaderBanner, getOriginalIndex } = useBanner()

    const isClosable = banner.closable

    const handleClose = () => {
        const originalIndex = getOriginalIndex(index)
        if (originalIndex !== -1) {
            hideHeaderBanner(originalIndex)
        }
    }

    return (
        <VStack
            w="100dvw"
            bg="contentBackground"
            pt={1}
            pb={2}
            gap={1}
            zIndex={1}
            textAlign="center"
            position="relative"
        >
            <Text fontSize="2xl" fontWeight="bold" px={isClosable ? 10 : 3}>
                {banner.title}
            </Text>
            <Text px={3}>{banner.content}</Text>
            {isClosable && <ModalCloseButton onClose={handleClose} noRadius />}
        </VStack>
    )
}
