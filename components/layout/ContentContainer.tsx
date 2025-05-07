"use client"

import { VStack, Box } from "@chakra-ui/react"
import { ReactNode } from "react"

import Toaster from "../ui/toaster"
import Header from "../layout/Header"
import Footer from "./Footer"
interface ContentContainerProps {
    children: ReactNode
}

export default function ContentContainer({ children }: ContentContainerProps) {
    return (
        <VStack minH="100dvh" gap={0} overflow={"hidden"}>
            <Toaster />
            <Header />
            <VStack
                alignItems={"center"}
                justifyContent={"center"}
                gap={5}
                w={"100%"}
                maxW={{ base: "100%", sm: "95dvw" }}
                pt={{ base: 0, sm: 5 }}
            >
                {children}
            </VStack>
            <Box flexGrow={1} minH={"100px"} />
            <Footer />
        </VStack>
    )
}
