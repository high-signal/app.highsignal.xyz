"use client"

import { HStack, Text, Box, Spinner, useBreakpointValue, useToken, Slider } from "@chakra-ui/react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useGetUsers } from "../../hooks/useGetUsers"
import { ASSETS } from "../../config/constants"
import Matter from "matter-js"
import { calculateRings } from "../../utils/bubble-utils/ringCalculations"
import { useZoom } from "../../utils/bubble-utils/handleZoom"
import { useDebounce } from "../../hooks/useDebounce"

interface BodyWithElement extends Matter.Body {
    element: HTMLDivElement
}

export default function BubbleDisplay({ project }: { project: string }) {
    const initialZoom = 1
    const physicsDuration = 8000 // TODO: Make this dynamic based on the number of circles
    const boxSize = useBreakpointValue({ base: 300, sm: 600 }) || 600
    const minSpacing = useBreakpointValue({ base: 15, sm: 25 }) || 25

    const [userMultiplier, setUserMultiplier] = useState(1)
    const debouncedMultiplier = useDebounce(userMultiplier, 500)
    const engineRef = useRef<Matter.Engine | null>(null)
    const renderRef = useRef<Matter.Render | null>(null)
    const [isCanvasLoading, setIsCanvasLoading] = useState(true)

    const { users, loading, error } = useGetUsers(project)
    const { zoom, transformOrigin, isZooming, handleWheel, containerRef } = useZoom({
        initialZoom,
        maxZoom: 5,
        zoomStep: 0.2,
    })

    type SignalType = "high" | "mid" | "low"
    type ScoreColors = Record<SignalType, string>

    // Get the score colors from the theme
    const scoreColors: ScoreColors = {
        high: useToken("colors", "scoreColor.high")[0],
        mid: useToken("colors", "scoreColor.mid")[0],
        low: useToken("colors", "scoreColor.low")[0],
    }

    const cleanupPhysics = useCallback(() => {
        if (engineRef.current) {
            // Clear all bodies from the world
            Matter.World.clear(engineRef.current.world, false)
            Matter.Engine.clear(engineRef.current)
            engineRef.current = null
        }
        if (renderRef.current) {
            Matter.Render.stop(renderRef.current)
            renderRef.current = null
        }
        // Remove all custom elements
        if (containerRef.current) {
            const elements = containerRef.current.querySelectorAll('div[style*="position: absolute"]')
            elements.forEach((element) => element.remove())
        }
    }, [containerRef])

    useEffect(() => {
        const setupPhysics = async () => {
            if (!containerRef.current || !users || users.length === 0) return
            setIsCanvasLoading(true)

            // Cleanup existing physics and elements
            cleanupPhysics()

            // Create engine
            const engine = Matter.Engine.create()
            engineRef.current = engine

            // Create renderer
            const render = Matter.Render.create({
                element: containerRef.current,
                engine: engine,
                options: {
                    width: boxSize,
                    height: boxSize,
                    wireframes: false,
                    background: "pageBackground",
                },
            })
            renderRef.current = render

            // Add mouse wheel event listener for zooming
            containerRef.current.addEventListener("wheel", handleWheel, { passive: false })

            // Create user circles
            const duplicatedUsers = Array(debouncedMultiplier).fill(users).flat()

            // Sort users by signal type
            const sortedUsers = [...duplicatedUsers].sort((a, b) => {
                const signalOrder = { high: 0, mid: 1, low: 2 }
                return signalOrder[a.signal as SignalType] - signalOrder[b.signal as SignalType]
            })

            // Calculate optimal ring arrangement
            const { allRings, center, innerRadius, maxRadius, circleRadius } = calculateRings({
                users: sortedUsers,
                minSpacing,
                boxSize,
            })

            // Create bodies in concentric rings
            const bodies = sortedUsers.map((user, index) => {
                let circleIndex = index
                let ringIndex = 0
                let angle = 0
                let radius = innerRadius

                // Find which ring this circle belongs to
                while (ringIndex < allRings.length && circleIndex >= allRings[ringIndex].count) {
                    circleIndex -= allRings[ringIndex].count
                    ringIndex++
                }

                if (ringIndex < allRings.length) {
                    const ring = allRings[ringIndex]
                    // Calculate evenly spaced angle for this circle in the ring
                    angle = (2 * Math.PI * circleIndex) / ring.count
                    radius = ring.radius
                } else {
                    // Fallback for any remaining circles - place them in a tight circle
                    angle = (2 * Math.PI * circleIndex) / sortedUsers.length
                    radius = maxRadius
                }

                // Calculate position with even spacing
                const x = center.x + radius * Math.cos(angle)
                const y = center.y + radius * Math.sin(angle)

                // Create a custom HTML element for the circle
                const element = document.createElement("div")
                element.style.width = `${circleRadius * 2 - 2}px`
                element.style.height = `${circleRadius * 2 - 2}px`
                element.style.borderRadius = "50%"
                element.style.overflow = "hidden"
                element.style.cursor = "pointer"
                element.style.position = "absolute"
                element.style.transform = "translate(-50%, -50%)"
                element.style.border = `${Math.min(Math.max(circleRadius / 5, 1), 8)}px solid`
                element.style.borderColor = scoreColors[user.signal as SignalType]

                // Add the image
                const img = document.createElement("img")
                img.src = user.profileImageUrl || ASSETS.DEFAULT_PROFILE_IMAGE
                img.style.width = "100%"
                img.style.height = "100%"
                img.style.objectFit = "cover"
                element.appendChild(img)

                // Add click handler
                element.addEventListener("click", () => {
                    window.location.href = `/u/${user.username}`
                })

                // Add the element to the scene
                containerRef.current?.appendChild(element)

                const body = Matter.Bodies.circle(x, y, circleRadius, {
                    // restitution: 0.2,
                    // friction: 0.8,
                    render: {
                        visible: false,
                    },
                }) as BodyWithElement

                // Store reference to the element
                body.element = element

                return body
            })

            // Add all bodies to the world
            Matter.World.add(engine.world, bodies)

            // Add central wall
            const wallRadius = Math.max(boxSize / 12, 30)
            const wall = Matter.Bodies.circle(boxSize / 2, boxSize / 2, wallRadius, {
                isStatic: true,
                render: {
                    visible: true,
                },
            })

            // Add wall to the world
            Matter.World.add(engine.world, wall)

            // Run the engine
            Matter.Render.run(render)
            const runner = Matter.Runner.create()
            Matter.Runner.run(runner, engine)

            // Track physics time elapsed
            let physicsTimeElapsed = 0
            const physicsTimeStep = 1000 / 30 // Target 60 FPS physics updates
            const targetPhysicsTime = physicsDuration
            const startTime = Date.now()

            Matter.Events.on(engine, "beforeUpdate", () => {
                physicsTimeElapsed += physicsTimeStep
                if (physicsTimeElapsed >= targetPhysicsTime) {
                    console.log("Stopped physics")
                    const realTimeElapsed = Date.now() - startTime
                    console.log(`Real time elapsed: ${realTimeElapsed}ms`)
                    console.log(`Engine time elapsed: ${physicsTimeElapsed}ms`)
                    Matter.Runner.stop(runner)
                    Matter.Engine.clear(engine)
                }
            })

            // Update element positions based on physics
            let animationFrameId: number
            const updateElements = () => {
                bodies.forEach((body) => {
                    const element = (body as BodyWithElement).element
                    if (element) {
                        // Only update if velocity is above threshold to prevent jitter
                        const velocityThreshold = 0.01
                        const velocity = Math.sqrt(
                            body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y,
                        )

                        if (velocity > velocityThreshold) {
                            element.style.left = `${body.position.x}px`
                            element.style.top = `${body.position.y}px`
                        }
                    }
                })
                animationFrameId = requestAnimationFrame(updateElements)
            }

            Matter.Events.on(engine, "afterUpdate", () => {
                // Start the animation frame loop
                if (!animationFrameId) {
                    updateElements()
                }
            })

            // Disable default gravity
            engine.gravity.x = 0
            engine.gravity.y = 0

            // Add central gravitational force
            const gravityStrength = 0.0005

            Matter.Events.on(engine, "beforeUpdate", () => {
                bodies.forEach((body) => {
                    const dx = center.x - body.position.x
                    const dy = center.y - body.position.y
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance > 0) {
                        const force = {
                            x: (dx / distance) * gravityStrength * body.mass,
                            y: (dy / distance) * gravityStrength * body.mass,
                        }
                        Matter.Body.applyForce(body, body.position, force)
                    }
                })
            })

            setIsCanvasLoading(false)

            // Cleanup
            return () => {
                containerRef.current?.removeEventListener("wheel", handleWheel)
                cleanupPhysics()
            }
        }

        setupPhysics()
    }, [users, debouncedMultiplier, cleanupPhysics])

    if (loading) return <Spinner />
    if (error) return <Text color="red.500">Error loading users</Text>

    return (
        <Box>
            <Slider.Root
                defaultValue={[1]}
                min={1}
                max={200}
                step={1}
                value={[userMultiplier]}
                onValueChange={({ value }) => setUserMultiplier(value[0])}
                mb={4}
            >
                <Slider.Label>User Multiplier</Slider.Label>
                <Slider.Control>
                    <Slider.Track>
                        <Slider.Range />
                    </Slider.Track>
                    <Slider.Thumb index={0}>
                        <Box
                            position="absolute"
                            top="-30px"
                            left="50%"
                            transform="translateX(-50%)"
                            bg="blue.500"
                            color="white"
                            px={2}
                            py={1}
                            borderRadius="md"
                            fontSize="sm"
                        >
                            {userMultiplier}x
                        </Box>
                    </Slider.Thumb>
                </Slider.Control>
            </Slider.Root>
            <HStack
                boxSize={`${boxSize}px`}
                border={"5px solid"}
                borderColor="gray.800"
                borderRadius="100%"
                overflow="hidden"
                justifyContent="center"
                alignItems="center"
                position="relative"
            >
                {isCanvasLoading && <Spinner zIndex={10} position={"absolute"} />}
                <Box
                    ref={containerRef}
                    boxSize={`${boxSize}px`}
                    clipPath={`circle(${boxSize / 2}px at center)`}
                    transformOrigin={transformOrigin}
                    transform={`scale(${zoom})`}
                    transition={isZooming ? "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)" : "none"}
                    css={{
                        canvas: {
                            img: {
                                borderRadius: "50%",
                                objectFit: "cover",
                                width: "100%",
                                height: "100%",
                            },
                        },
                    }}
                />
            </HStack>
        </Box>
    )
}
