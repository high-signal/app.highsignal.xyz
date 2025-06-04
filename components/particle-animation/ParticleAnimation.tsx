"use client"

import React, { useRef, useState, useLayoutEffect, useMemo } from "react"
import { Box, useBreakpointValue } from "@chakra-ui/react"
import { keyframes } from "@emotion/react"

const ParticleAnimation = ({ particleDirection = "up" }: { particleDirection?: "down" | "up" }) => {
    const containerRef = useRef(null)

    // Only use the initial height on the first render
    // This is to avoid re-rendering on overscroll on mobile
    const initialHeight = useRef(typeof window !== "undefined" ? window.innerHeight : 1080)
    const [pageSize, setPageSize] = useState({
        width: typeof window !== "undefined" ? window.innerWidth : 1920,
    })

    const animationLengthSeconds = 100

    // Use breakpoint value to determine if we're in mobile view
    const isMobile = useBreakpointValue({ base: true, sm: false })

    useLayoutEffect(() => {
        const updatePageWidth = () => {
            // Do not update particles on mobile page width change as it is triggered by pinch zoom
            if (!isMobile) {
                setPageSize({
                    width: window.innerWidth,
                })
            }
        }

        updatePageWidth()
        window.addEventListener("resize", updatePageWidth)

        return () => window.removeEventListener("resize", updatePageWidth)
    }, [isMobile])

    const animParticle = keyframes`
    from { transform: translateY(${particleDirection === "down" ? "-100vh" : "0"}); }
    to { transform: translateY(${particleDirection === "down" ? "0" : "-100vh"}); }
    `

    const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
    `

    // Memoize particle generation
    const particles = useMemo(() => {
        // Helper function to generate particle shadows within the viewport dimensions
        function generateParticles(maxParticles: number, pageSizeMultiplier: number) {
            const colorParticle = "{colors.particleColor}"
            let particles = `0px 0px ${colorParticle}`

            for (let i = 1; i <= maxParticles; i++) {
                const x = Math.random() * pageSize.width
                const y = Math.random() * (pageSizeMultiplier * initialHeight.current)
                particles += `, ${x}px ${y}px ${colorParticle}`
            }
            return particles
        }

        return {
            layer1: {
                base: generateParticles(pageSize.width / 3, 8),
                sm: generateParticles(pageSize.width / 1.6, 8),
            },
            layer2: {
                base: generateParticles(pageSize.width / 19, 4),
                sm: generateParticles(pageSize.width / 9, 4),
            },
            layer3: {
                base: generateParticles(pageSize.width / 19, 4),
                sm: generateParticles(pageSize.width / 9, 4),
            },
            layer4: generateParticles(pageSize.width / 12, 2),
            after1: generateParticles(pageSize.width / 4, 8),
            after2: generateParticles(pageSize.width / 14, 4),
            after3: generateParticles(pageSize.width / 6, 4),
            after4: generateParticles(pageSize.width / 21, 2),
        }
    }, [pageSize.width])

    return (
        <Box ref={containerRef} position="relative" width="100%" height="100%" overflow="visible">
            <Box
                position="absolute"
                borderRadius="50%"
                bg="transparent"
                animation={`${animParticle} ${animationLengthSeconds}s linear infinite, ${fadeIn} 0.5s ease-in`}
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
                    animation: `${fadeIn} 0.5s ease-in`,
                }}
            />
            <Box
                position="absolute"
                borderRadius="50%"
                bg="transparent"
                animation={`${animParticle} ${animationLengthSeconds * 2}s linear infinite, ${fadeIn} 0.5s ease-in`}
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
                    animation: `${fadeIn} 0.5s ease-in`,
                }}
            />
            <Box
                position="absolute"
                borderRadius="50%"
                bg="transparent"
                animation={`${animParticle} ${animationLengthSeconds * 3}s linear infinite, ${fadeIn} 0.5s ease-in`}
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
                    animation: `${fadeIn} 0.5s ease-in`,
                }}
            />
            <Box
                position="absolute"
                borderRadius="50%"
                bg="transparent"
                animation={`${animParticle} ${animationLengthSeconds * 4}s linear infinite, ${fadeIn} 0.5s ease-in`}
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
                    animation: `${fadeIn} 0.5s ease-in`,
                }}
            />
        </Box>
    )
}

export default ParticleAnimation
