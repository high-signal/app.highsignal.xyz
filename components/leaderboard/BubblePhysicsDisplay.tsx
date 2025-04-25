"use client"

import { HStack, Text, Box, Spinner, useBreakpointValue, useToken } from "@chakra-ui/react"
import { useState, useEffect, useRef } from "react"
import { useGetUsers } from "../../hooks/useGetUsers"
import { ASSETS } from "../../config/constants"
import Matter from "matter-js"

interface BodyWithElement extends Matter.Body {
    element: HTMLDivElement
}

export default function BubblePhysicsDisplay({ project }: { project: string }) {
    const boxSize = useBreakpointValue({ base: 300, sm: 600 }) || 600
    const initialZoom = 1
    const borderWidth = useBreakpointValue({ base: 1, sm: 2 }) || 2
    const circleRadius = useBreakpointValue({ base: 5, sm: 10 }) || 10
    const minSpacing = useBreakpointValue({ base: 15, sm: 25 }) || 25
    const { users, loading, error } = useGetUsers(project)
    const sceneRef = useRef<HTMLDivElement>(null)
    const engineRef = useRef<Matter.Engine | null>(null)
    const renderRef = useRef<Matter.Render | null>(null)
    const [zoom, setZoom] = useState(initialZoom)
    const [transformOrigin, setTransformOrigin] = useState("center")
    const [isZooming, setIsZooming] = useState(false)
    const [isCanvasLoading, setIsCanvasLoading] = useState(true)

    type SignalType = "high" | "mid" | "low"
    type ScoreColors = Record<SignalType, string>

    // Get the score colors from the theme
    const scoreColors: ScoreColors = {
        high: useToken("colors", "scoreColor.high")[0],
        mid: useToken("colors", "scoreColor.mid")[0],
        low: useToken("colors", "scoreColor.low")[0],
    }

    // Use ref to store the zoom value so it can be used in the wheel event handler
    // inside the useEffect hook without causing a re-render
    const zoomRef = useRef(zoom)
    useEffect(() => {
        zoomRef.current = zoom
    }, [zoom])

    // TODO: Update zoom when screen width changes
    // useEffect(() => {
    //     setZoom(initialZoom)
    //     zoomRef.current = initialZoom
    // }, [])

    useEffect(() => {
        const setupPhysics = async () => {
            if (!sceneRef.current || !users || users.length === 0) return
            setIsCanvasLoading(true)

            // Create engine
            const engine = Matter.Engine.create()
            engineRef.current = engine

            // Create renderer
            const render = Matter.Render.create({
                element: sceneRef.current,
                engine: engine,
                options: {
                    width: boxSize,
                    height: boxSize,
                    wireframes: false,
                    background: "pageBackground",
                },
            })
            renderRef.current = render

            // Add central wall
            const wallRadius = 2
            const wall = Matter.Bodies.circle(boxSize / 2, boxSize / 2, wallRadius, {
                isStatic: true,
                render: {
                    visible: false,
                },
            })

            // Add wall to the world
            Matter.World.add(engine.world, wall)

            // Add mouse wheel event listener for zooming
            const handleWheel = (event: WheelEvent) => {
                event.preventDefault()
                const currentZoom = zoomRef.current

                const delta = event.deltaY

                if (delta < 0) {
                    // Get mouse position relative to the container
                    const rect = sceneRef.current!.getBoundingClientRect()
                    const x = event.clientX - rect.left
                    const y = event.clientY - rect.top

                    // Calculate percentage position
                    const xPercent = (x / rect.width) * 100
                    const yPercent = (y / rect.height) * 100

                    // Set transform origin to mouse position
                    setTransformOrigin(`${xPercent}% ${yPercent}%`)
                }

                const zoomStep = 0.2
                const maxZoom = 5

                let newZoom = currentZoom
                if (delta > 0) {
                    newZoom = currentZoom - zoomStep
                } else {
                    newZoom = currentZoom + zoomStep
                }
                if (newZoom <= initialZoom) {
                    // Reset transform origin to center when fully zoomed out
                    setTransformOrigin("center")
                    setZoom(initialZoom)
                } else if (newZoom >= maxZoom) {
                    setZoom(maxZoom)
                } else {
                    setZoom(Number(newZoom.toFixed(3)))
                }

                setIsZooming(true)
                // Reset zooming state after animation
                setTimeout(() => setIsZooming(false), 500)
            }

            sceneRef.current.addEventListener("wheel", handleWheel, { passive: false })

            // Create user circles
            const duplicatedUsers = Array(100).fill(users).flat() // TODO: Remove this and use the actual number of users

            // Sort users by signal type
            const sortedUsers = [...duplicatedUsers].sort((a, b) => {
                const signalOrder = { high: 0, mid: 1, low: 2 }
                return signalOrder[a.signal as SignalType] - signalOrder[b.signal as SignalType]
            })

            // Calculate optimal ring arrangement
            const bodyRadius = circleRadius // Use the responsive circleRadius from component level
            const center = { x: boxSize / 2, y: boxSize / 2 }
            const innerRadius = boxSize / 2 + bodyRadius * 3 // Start from center
            const maxRadius = (boxSize / 2) * 1.8 // Allow expansion outward

            // Group users by signal type
            const highSignalUsers = sortedUsers.filter((user) => user.signal === "high")
            const midSignalUsers = sortedUsers.filter((user) => user.signal === "mid")
            const lowSignalUsers = sortedUsers.filter((user) => user.signal === "low")

            // Calculate rings for each signal type with better spacing
            const calculateRings = (users: typeof sortedUsers, startRadius: number, endRadius: number) => {
                let remainingCircles = users.length
                let currentRadius = startRadius
                const rings: { radius: number; count: number }[] = []

                // Calculate total available space for this signal type
                const totalSpace = endRadius - startRadius
                const maxRings = Math.floor(totalSpace / (bodyRadius * 2 + minSpacing))

                // Calculate how many circles should be in each ring
                const circlesPerRing = Math.ceil(users.length / maxRings)

                while (remainingCircles > 0 && currentRadius <= endRadius) {
                    const circlesToAdd = Math.min(circlesPerRing, remainingCircles)
                    if (circlesToAdd > 0) {
                        rings.push({ radius: currentRadius, count: circlesToAdd })
                        remainingCircles -= circlesToAdd
                    }
                    currentRadius += bodyRadius * 2 + minSpacing
                }

                return rings
            }

            // Calculate target radii for each signal type
            const highEndRadius = innerRadius + (maxRadius - innerRadius) * 0.33
            const midEndRadius = innerRadius + (maxRadius - innerRadius) * 0.66

            // Calculate rings for each signal type
            const highSignalRings = calculateRings(highSignalUsers, innerRadius, highEndRadius)
            const midSignalRings = calculateRings(
                midSignalUsers,
                highEndRadius + bodyRadius * 2 + minSpacing,
                midEndRadius,
            )
            const lowSignalRings = calculateRings(lowSignalUsers, midEndRadius + bodyRadius * 2 + minSpacing, maxRadius)

            // Combine all rings
            const allRings = [...highSignalRings, ...midSignalRings, ...lowSignalRings]

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
                element.style.width = `${bodyRadius * 2 - 2}px`
                element.style.height = `${bodyRadius * 2 - 2}px`
                element.style.borderRadius = "50%"
                element.style.overflow = "hidden"
                element.style.cursor = "pointer"
                element.style.position = "absolute"
                element.style.transform = "translate(-50%, -50%)"
                element.style.border = `${borderWidth}px solid`
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
                sceneRef.current?.appendChild(element)

                const body = Matter.Bodies.circle(x, y, bodyRadius, {
                    // restitution: 0.3,
                    // friction: 1,
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

            // Run the engine
            Matter.Render.run(render)
            const runner = Matter.Runner.create()
            Matter.Runner.run(runner, engine)

            // Update element positions based on physics
            Matter.Events.on(engine, "afterUpdate", () => {
                bodies.forEach((body) => {
                    const element = (body as BodyWithElement).element
                    if (element) {
                        element.style.left = `${body.position.x}px`
                        element.style.top = `${body.position.y}px`
                        element.style.transform = `translate(-50%, -50%)`
                    }
                })
            })

            // Disable default gravity
            engine.gravity.x = 0
            engine.gravity.y = 0

            // Add central anchor point
            const anchorRadius = 10
            const anchor = Matter.Bodies.circle(center.x, center.y, anchorRadius, {
                isStatic: true,
                render: {
                    fillStyle: "transparent",
                },
            })
            Matter.World.add(engine.world, anchor)

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
                sceneRef.current?.removeEventListener("wheel", handleWheel)
                Matter.Render.stop(render)
                Matter.World.clear(engine.world, false)
                Matter.Engine.clear(engine)
                // Remove all custom elements
                bodies.forEach((body) => {
                    const element = (body as BodyWithElement).element
                    if (element && element.parentNode) {
                        element.parentNode.removeChild(element)
                    }
                })
            }
        }

        setupPhysics()
    }, [users])

    if (loading) return <Spinner />
    if (error) return <Text color="red.500">Error loading users</Text>

    return (
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
                ref={sceneRef}
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
    )
}
