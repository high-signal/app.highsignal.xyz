"use client"

import { Box } from "@chakra-ui/react"
import { useParticles } from "../../contexts/ParticleContext"
import ParticleAnimation from "./ParticleAnimation"

export default function RootParticleAnimation() {
    const { showParticles } = useParticles()

    return (
        <Box
            position="fixed"
            top={0}
            left={0}
            w="100%"
            h="100%"
            opacity={showParticles ? 1 : 0}
            transition="opacity 1s ease-in-out"
            zIndex={0}
            pointerEvents="none"
            style={{
                isolation: "isolate",
            }}
        >
            {showParticles && <ParticleAnimation particleDirection={"up"} />}
        </Box>
    )
}
