"use client"

import { VStack, Box } from "@chakra-ui/react"
import { useLayoutEffect, useState } from "react"

import Header from "../layout/Header"
import Footer from "./Footer"
import ParticleAnimation from "../animations/ParticleAnimation"
import SignalDisplay from "../SignalDisplay"

export default function ContentContainer() {
    const [showParticles, setShowParticles] = useState(false)

    useLayoutEffect(() => {
        setShowParticles(true)
    }, [])

    return (
        <VStack minH="100dvh" gap={0} overflow={"hidden"}>
            {/* <Box w={"100%"} h={"100%"} opacity={showParticles ? 1 : 0} transition="opacity 1s ease-in-out">
                {showParticles && <ParticleAnimation particleDirection={"down"} />}
            </Box> */}
            <Header />
            <VStack
                alignItems={"center"}
                justifyContent={"center"}
                gap={5}
                w={"100%"}
                maxW="1400px"
                pt={{ base: 0, sm: 5 }}
            >
                <SignalDisplay />
            </VStack>
            <Box flexGrow={1} minH={"100px"} />
            <Footer />
        </VStack>
    )
}
