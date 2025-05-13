"use client"

import { Button } from "@chakra-ui/react"
import { useParticles } from "../../contexts/ParticleContext"

export default function ParticleToggle() {
    const { showParticles, setShowParticles } = useParticles()

    return (
        <Button
            secondaryButton
            aria-label="Toggle particles"
            onClick={() => {
                setShowParticles(!showParticles)
            }}
            transition="opacity 0.2s"
            fontSize={"xl"}
            borderRadius={"full"}
            h={"28px"}
            w={"28px"}
            minW={"28px"}
            maxW={"28px"}
            {...(showParticles && { "data-active": "true" })}
        >
            🫧
        </Button>
    )
}
