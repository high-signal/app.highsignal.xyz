"use client"

import React, { useRef, useState, useLayoutEffect, useMemo } from "react"
import { Box } from "@chakra-ui/react"
import { keyframes } from "@emotion/react"

const ParticleAnimation = ({ particleDirection = "up" }: { particleDirection?: "down" | "up" }) => {
    const containerRef = useRef(null)
    const [pageSize, setPageSize] = useState({
        width: typeof window !== "undefined" ? window.innerWidth : 1920,
        height: typeof window !== "undefined" ? window.innerHeight : 1080,
    })

    useLayoutEffect(() => {
        const updatePageWidth = () => {
            setPageSize({
                width: window.innerWidth,
                height: window.innerHeight,
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

    // Memoize particle generation
    const particles = useMemo(
        () => ({
            layer1: {
                base: generateParticles(600, 8),
                sm: generateParticles(1200, 8),
            },
            layer2: {
                base: generateParticles(100, 4),
                sm: generateParticles(210, 4),
            },
            layer3: {
                base: generateParticles(100, 4),
                sm: generateParticles(210, 4),
            },
            layer4: generateParticles(160, 2),
            after1: generateParticles(480, 8),
            after2: generateParticles(130, 4),
            after3: generateParticles(290, 4),
            after4: generateParticles(90, 2),
        }),
        [],
    ) // Empty dependency array means this only runs once

    return (
        <Box ref={containerRef} position="relative" width="100%" height="100%" overflow="visible">
            <Box
                position="absolute"
                borderRadius="50%"
                bg="transparent"
                animation={`${animParticle} 100s linear infinite`}
                boxShadow={{ base: particles.layer1.base, sm: particles.layer1.sm }}
                height="2px"
                width="2px"
                _after={{
                    content: '""',
                    borderRadius: "50%",
                    position: "absolute",
                    boxShadow: particles.after1,
                    height: "2px",
                    width: "2px",
                }}
            />
            <Box
                position="absolute"
                borderRadius="50%"
                bg="transparent"
                animation={`${animParticle} 200s linear infinite`}
                boxShadow={{ base: particles.layer2.base, sm: particles.layer2.sm }}
                height="2px"
                width="2px"
                _after={{
                    content: '""',
                    borderRadius: "50%",
                    position: "absolute",
                    boxShadow: particles.after2,
                    height: "3px",
                    width: "3px",
                }}
            />
            <Box
                position="absolute"
                borderRadius="50%"
                bg="transparent"
                animation={`${animParticle} 200s linear infinite`}
                boxShadow={{ base: particles.layer3.base, sm: particles.layer3.sm }}
                height="2px"
                width="2px"
                _after={{
                    content: '""',
                    borderRadius: "50%",
                    position: "absolute",
                    boxShadow: particles.after3,
                    height: "3px",
                    width: "3px",
                }}
            />
            <Box
                position="absolute"
                borderRadius="50%"
                bg="transparent"
                animation={`${animParticle} 400s linear infinite`}
                boxShadow={particles.layer4}
                height="1px"
                width="1px"
                _after={{
                    content: '""',
                    borderRadius: "50%",
                    position: "absolute",
                    boxShadow: particles.after4,
                    height: "1px",
                    width: "1px",
                }}
            />
        </Box>
    )
}

export default ParticleAnimation
