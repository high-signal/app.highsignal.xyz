"use client"

import { VStack, chakra, Box } from "@chakra-ui/react"

import Header from "../layout/Header"
import Footer from "../layout/Footer"

export default function NewProjectContainer() {
    return (
        <VStack w="100%" h="100dvh" maxH="100dvh" gap={0}>
            <Header />
            <Box flexGrow={1} w="100%" pt={"5px"} overflow="hidden" zIndex={1} style={{ colorScheme: "light" }}>
                <chakra.iframe
                    src="https://docs.google.com/forms/d/e/1FAIpQLSeGIGhHK-fKGEWTwTDWn3tC8b4U1M8LL4VSKK0EIY5OIkNhIA/viewform?embedded=true"
                    w="100%"
                    h="100%"
                    border="0"
                    loading="lazy"
                    pb={"20px"}
                />
            </Box>
            <Footer />
        </VStack>
    )
}
