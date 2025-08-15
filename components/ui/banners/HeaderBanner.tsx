"use client"

import { VStack, Text } from "@chakra-ui/react"

export default function HeaderBanner({ banner }: { banner: BannerProps }) {
    return (
        <VStack w="100dvw" bg="contentBackground" pt={1} px={3} pb={2} gap={1} zIndex={1} textAlign="center">
            <Text fontSize="2xl" fontWeight="bold">
                {banner.title}
            </Text>
            <Text>{banner.content} 123</Text>
        </VStack>
    )
}
