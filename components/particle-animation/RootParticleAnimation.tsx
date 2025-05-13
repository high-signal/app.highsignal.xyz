"use client"

import { Box } from "@chakra-ui/react"
import { useParticles } from "../../contexts/ParticleContext"
import ParticleAnimation from "./ParticleAnimation"

export default function RootParticleAnimation() {
    const { showParticles } = useParticles()

    return (
        <Box
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="100%"
            overflow="hidden"
            zIndex={0}
            style={{
                isolation: "isolate",
                pointerEvents: "none",
            }}
        >
            <Box position="absolute" top="0" left="0" width="100%" height="100%" transform="translateZ(0)">
                {showParticles && <ParticleAnimation particleDirection="up" />}
            </Box>
        </Box>
    )
}
