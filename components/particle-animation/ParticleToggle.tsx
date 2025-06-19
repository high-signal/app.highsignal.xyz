"use client"

import { Button, Spinner } from "@chakra-ui/react"
import { useParticles } from "../../contexts/ParticleContext"
import { useEffect, useState } from "react"

export default function ParticleToggle() {
    const { showParticles, setShowParticles } = useParticles()
    const [isLoading, setIsLoading] = useState(false)

    // Add a loading spinner when the particles are being loaded
    useEffect(() => {
        if (showParticles) {
            setTimeout(() => {
                setIsLoading(false)
            }, 500)
        } else {
            setIsLoading(false)
        }
    }, [showParticles])

    return (
        <Button
            secondaryButton
            aria-label="Toggle particles"
            onClick={() => {
                if (!showParticles) {
                    setIsLoading(true)
                    setTimeout(() => {
                        setShowParticles(true)
                    }, 100)
                } else {
                    setShowParticles(false)
                }
            }}
            // _active={{ _hover: { bg: "button.secondary.hover" } }}
            transition="opacity 0.2s"
            fontSize={"18px"}
            borderRadius={"full"}
            border={"2px solid"}
            borderColor={showParticles ? "teal.500" : "transparent"}
            h={"28px"}
            w={"28px"}
            minW={"28px"}
            maxW={"28px"}
            {...((showParticles || isLoading) && { "data-active": "true" })}
        >
            {isLoading ? <Spinner size="sm" /> : "🫧"}
        </Button>
    )
}
