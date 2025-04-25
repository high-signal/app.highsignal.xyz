"use client"

import { VStack, HStack, Text, Box, Table, Image, Spinner, useBreakpointValue } from "@chakra-ui/react"
import { Tooltip } from "../../components/ui/tooltip"
import { useRouter, useSearchParams } from "next/navigation"
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
    const borderWidth = 5

    const { users, loading, error } = useGetUsers(project)
    const sceneRef = useRef<HTMLDivElement>(null)
    const engineRef = useRef<Matter.Engine | null>(null)
    const renderRef = useRef<Matter.Render | null>(null)
    const [zoom, setZoom] = useState(initialZoom)
    const [transformOrigin, setTransformOrigin] = useState("center")
    const [isZooming, setIsZooming] = useState(false)
    const [isCanvasLoading, setIsCanvasLoading] = useState(true)

    // Update zoom when screen width changes
    useEffect(() => {
        setZoom(initialZoom)
    }, [initialZoom])

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

            // Add mouse wheel event listener for zooming
            const handleWheel = (event: WheelEvent) => {
                event.preventDefault()

                // Get mouse position relative to the container
                const rect = sceneRef.current!.getBoundingClientRect()
                const x = event.clientX - rect.left
                const y = event.clientY - rect.top

                // Calculate percentage position
                const xPercent = (x / rect.width) * 100
                const yPercent = (y / rect.height) * 100

                // Set transform origin to mouse position
                setTransformOrigin(`${xPercent}% ${yPercent}%`)

                const delta = event.deltaY
                const zoomStep = 2
                const newZoom = Math.max(1, Math.min(200, zoom + (delta > 0 ? -zoomStep : zoomStep)))
                setZoom(newZoom)
                setIsZooming(true)

                // Reset zooming state after animation
                setTimeout(() => setIsZooming(false), 150)
            }

            sceneRef.current.addEventListener("wheel", handleWheel, { passive: false })

            // Create user circles
            const duplicatedUsers = Array(100).fill(users).flat() // TODO: Remove this and use the actual number of users

            // Calculate optimal ring arrangement
            const bodyRadius = 10 // Radius of each circle
            const minSpacing = 25 // Minimum space between circles
            const center = { x: boxSize / 2, y: boxSize / 2 }
            const innerRadius = boxSize / 2 + bodyRadius * 3 // Start from center
            const maxRadius = (boxSize / 2) * 1.8 // Allow expansion outward

            // Calculate how many circles can fit in each ring
            const circlesPerRing = (radius: number) => {
                const circumference = 2 * Math.PI * radius
                return Math.floor(circumference / (bodyRadius * 2 + minSpacing))
            }

            // Calculate rings needed, working from center outward
            let remainingCircles = duplicatedUsers.length
            let currentRadius = innerRadius
            const rings: { radius: number; count: number }[] = []

            while (remainingCircles > 0 && currentRadius <= maxRadius) {
                const circlesInRing = circlesPerRing(currentRadius)
                const circlesToAdd = Math.min(circlesInRing, remainingCircles)
                if (circlesToAdd > 0) {
                    rings.push({ radius: currentRadius, count: circlesToAdd })
                    remainingCircles -= circlesToAdd
                }
                currentRadius += bodyRadius * 2 + minSpacing
            }

            // If we still have circles left, distribute them in the last ring
            if (remainingCircles > 0 && rings.length > 0) {
                rings[rings.length - 1].count += remainingCircles
            }

            // Create bodies in concentric rings
            const bodies = duplicatedUsers.map((user, index) => {
                let circleIndex = index
                let ringIndex = 0
                let angle = 0
                let radius = innerRadius

                // Find which ring this circle belongs to
                while (ringIndex < rings.length && circleIndex >= rings[ringIndex].count) {
                    circleIndex -= rings[ringIndex].count
                    ringIndex++
                }

                if (ringIndex < rings.length) {
                    const ring = rings[ringIndex]
                    angle = (2 * Math.PI * circleIndex) / ring.count
                    radius = ring.radius
                } else {
                    // Fallback for any remaining circles - place them in a tight circle
                    angle = (2 * Math.PI * circleIndex) / remainingCircles
                    radius = maxRadius
                }

                const x = center.x + radius * Math.cos(angle)
                const y = center.y + radius * Math.sin(angle)

                // Create a custom HTML element for the circle
                const element = document.createElement("div")
                element.style.width = `${bodyRadius * 2 - 1}px`
                element.style.height = `${bodyRadius * 2 - 1}px`
                element.style.borderRadius = "50%"
                element.style.overflow = "hidden"
                element.style.cursor = "pointer"
                element.style.position = "absolute"
                element.style.transform = "translate(-50%, -50%)"

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
                    restitution: 0.3,
                    friction: 0.2,
                    render: {
                        visible: false, // Hide the default canvas rendering
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
                        element.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`
                    }
                })
            })

            // Disable default gravity
            engine.gravity.x = 0
            engine.gravity.y = 0

            // Add central anchor point
            const anchorRadius = 30
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

            // Add a 1 second delay before hiding the spinner to allow gravity to take effect
            setTimeout(() => {
                setIsCanvasLoading(false)
            }, 1000)

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
            border={`${borderWidth}px solid`}
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
                transition={isZooming ? "transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)" : "none"}
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
