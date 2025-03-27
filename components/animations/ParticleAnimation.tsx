"use client"

import React, { useRef, useState, useLayoutEffect } from "react"
import { Box } from "@chakra-ui/react"
import { keyframes } from "@emotion/react"

const ParticleAnimation = ({ particleDirection = "up" }: { particleDirection?: "down" | "up" }) => {
    const containerRef = useRef(null)
    const [pageSize, setPageSize] = useState({
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
    })

    useLayoutEffect(() => {
        const updatePageWidth = () => {
            setPageSize((prev) => {
                const newWidth = document.documentElement.scrollWidth
                return prev.width !== newWidth ? { ...prev, width: newWidth } : prev
            })
        }

        updatePageWidth()
        window.addEventListener("resize", updatePageWidth)

        return () => window.removeEventListener("resize", updatePageWidth)
    }, [])

    const animParticle = keyframes`
    from { transform: translateY(${particleDirection === "down" ? -pageSize.height : 0}px); }
    to { transform: translateY(${particleDirection === "down" ? 0 : -pageSize.height}px); }
  `

    // Helper function to generate particle shadows within the viewport dimensions
    function generateParticles(maxParticles: number, pageSizeMultiplier: number) {
        const colorParticle = "{colors.particleColor}"
        let particles = `0px 0px ${colorParticle}`

        for (let i = 1; i <= maxParticles; i++) {
            const x = Math.random() * pageSize.width
            const y = Math.random() * (pageSizeMultiplier * pageSize.height)
            particles += `, ${x}px ${y}px ${colorParticle}`
        }
        return particles
    }

    return (
        <Box ref={containerRef} position="relative" width="100%" height="100%" overflow="visible">
            <Box
                position="absolute"
                borderRadius="50%"
                bg="transparent"
                animation={`${animParticle} 100s linear infinite`}
                boxShadow={{ base: generateParticles(600, 8), sm: generateParticles(1200, 8) }}
                height="2px"
                width="2px"
                _after={{
                    content: '""',
                    borderRadius: "50%",
                    position: "absolute",
                    boxShadow: generateParticles(480, 8),
                    height: "2px",
                    width: "2px",
                }}
            />
            <Box
                position="absolute"
                borderRadius="50%"
                bg="transparent"
                animation={`${animParticle} 200s linear infinite`}
                boxShadow={{ base: generateParticles(100, 4), sm: generateParticles(210, 4) }}
                height="2px"
                width="2px"
                _after={{
                    content: '""',
                    borderRadius: "50%",
                    position: "absolute",
                    boxShadow: generateParticles(130, 4),
                    height: "3px",
                    width: "3px",
                }}
            />
            <Box
                position="absolute"
                borderRadius="50%"
                bg="transparent"
                animation={`${animParticle} 200s linear infinite`}
                boxShadow={{ base: generateParticles(100, 4), sm: generateParticles(210, 4) }}
                height="2px"
                width="2px"
                _after={{
                    content: '""',
                    borderRadius: "50%",
                    position: "absolute",
                    boxShadow: generateParticles(290, 4),
                    height: "3px",
                    width: "3px",
                }}
            />
            <Box
                position="absolute"
                borderRadius="50%"
                bg="transparent"
                animation={`${animParticle} 400s linear infinite`}
                boxShadow={generateParticles(160, 2)}
                height="1px"
                width="1px"
                _after={{
                    content: '""',
                    borderRadius: "50%",
                    position: "absolute",
                    boxShadow: generateParticles(90, 2),
                    height: "1px",
                    width: "1px",
                }}
            />
        </Box>
    )
}

export default ParticleAnimation
