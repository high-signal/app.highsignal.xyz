"use client"

import { VStack, Box, Text } from "@chakra-ui/react"
import { ReactNode } from "react"

import Header from "../layout/Header"
import Footer from "./Footer"

interface ContentContainerProps {
    children: ReactNode
}

export default function ContentContainer({ children }: ContentContainerProps) {
    return (
        <VStack minH="100dvh" gap={0} overflow={"hidden"}>
            <Header />
            {/* <Text fontWeight="bold" textAlign="center" py={0} px={2} bg={"pink.800"} w={"100%"} mt={2}>
                Alpha Testing - Demo Data
            </Text> */}
            <VStack
                alignItems={"center"}
                justifyContent={"center"}
                gap={5}
                w={"100%"}
                maxW="1400px"
                pt={{ base: 0, sm: 5 }}
            >
                {children}
            </VStack>
            <Box flexGrow={1} minH={"100px"} />
            <Footer />
        </VStack>
    )
}
