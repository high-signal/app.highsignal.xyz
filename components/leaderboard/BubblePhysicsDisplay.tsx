"use client"

import { VStack, HStack, Text, Box, Table, Image, Spinner, useBreakpointValue } from "@chakra-ui/react"
import { Tooltip } from "../../components/ui/tooltip"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { useGetUsers } from "../../hooks/useGetUsers"
import { ASSETS } from "../../config/constants"
import Matter from "matter-js"

export default function BubblePhysicsDisplay({ project }: { project: string }) {
    const boxSize = useBreakpointValue({ base: 300, sm: 600 }) || 600
    const initialZoom = useBreakpointValue({ base: 0.05, sm: 0.1 }) || 0.1
    const borderWidth = 5
    const zoomedBoxSize = boxSize / initialZoom

    const { users, loading, error } = useGetUsers(project)
    const sceneRef = useRef<HTMLDivElement>(null)
    const engineRef = useRef<Matter.Engine | null>(null)
    const renderRef = useRef<Matter.Render | null>(null)
    const bodiesRef = useRef<Matter.Body[]>([])
    const [zoom, setZoom] = useState(initialZoom)
    const [transformOrigin, setTransformOrigin] = useState("center")
    const [isZooming, setIsZooming] = useState(false)

    // Use ref to store the zoom value so it can be used in the wheel event handler
    // inside the useEffect hook without causing a re-render
    const zoomRef = useRef(zoom)
    useEffect(() => {
        zoomRef.current = zoom
    }, [zoom])

    // Update zoom when screen width changes
    useEffect(() => {
        setZoom(initialZoom)
        zoomRef.current = initialZoom
    }, [initialZoom])

    useEffect(() => {
        const setupPhysics = async () => {
            if (!sceneRef.current || !users || users.length === 0) return

            // Create engine
            const engine = Matter.Engine.create()
            engineRef.current = engine

            // Create renderer
            const render = Matter.Render.create({
                element: sceneRef.current,
                engine: engine,
                options: {
                    width: zoomedBoxSize,
                    height: zoomedBoxSize,
                    wireframes: false,
                    background: "pageBackground",
                },
            })
            renderRef.current = render

            // Add mouse wheel event listener for zooming
            const handleWheel = (event: WheelEvent) => {
                event.preventDefault()
                const currentZoom = zoomRef.current

                // // Get mouse position relative to the container
                // const rect = sceneRef.current!.getBoundingClientRect()
                // const x = event.clientX - rect.left
                // const y = event.clientY - rect.top

                // // Calculate percentage position
                // const xPercent = (x / rect.width) * 100
                // const yPercent = (y / rect.height) * 100

                // // Set transform origin to mouse position
                // setTransformOrigin(`${xPercent}% ${yPercent}%`)

                const delta = event.deltaY
                const zoomStep = 0.04
                const maxZoom = 0.5

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
                setTimeout(() => setIsZooming(false), 150)
            }

            sceneRef.current.addEventListener("wheel", handleWheel, { passive: false })

            // Create user circles
            const duplicatedUsers = Array(100).fill(users).flat()
            const results = await Promise.all(
                duplicatedUsers.map((user) => makeCircularImage(user.profileImageUrl || ASSETS.DEFAULT_PROFILE_IMAGE)),
            )

            // Calculate optimal ring arrangement
            const bodyRadius = 100 // Radius of each circle
            const minSpacing = 20 // Minimum space between circles
            const center = { x: zoomedBoxSize / 2, y: zoomedBoxSize / 2 }
            const innerRadius = zoomedBoxSize / 2 + bodyRadius * 3 // Start from center
            const maxRadius = (zoomedBoxSize / 2) * 1.8 // Allow expansion outward

            // Calculate how many circles can fit in each ring
            const circlesPerRing = (radius: number) => {
                const circumference = 2 * Math.PI * radius
                return Math.floor(circumference / (bodyRadius * 2 + minSpacing))
            }

            // Calculate rings needed, working from center outward
            let remainingCircles = results.length
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
            const bodies = results.map(({ dataUrl, size }, index) => {
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
                const scale = (bodyRadius * 2) / size

                const body = Matter.Bodies.circle(x, y, bodyRadius, {
                    restitution: 0.3,
                    friction: 0.1,
                    render: {
                        sprite: {
                            texture: dataUrl,
                            xScale: scale,
                            yScale: scale,
                        },
                    },
                })
                return body
            })
            bodiesRef.current = bodies

            // Add all bodies to the world
            Matter.World.add(engine.world, bodies)

            // Run the engine
            Matter.Render.run(render)
            const runner = Matter.Runner.create()
            Matter.Runner.run(runner, engine)

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

            return () => {
                sceneRef.current?.removeEventListener("wheel", handleWheel)
                Matter.Render.stop(render)
                Matter.World.clear(engine.world, false)
                Matter.Engine.clear(engine)
                render.canvas.remove()
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
        >
            <Box
                ref={sceneRef}
                boxSize={`${zoomedBoxSize}px`}
                clipPath={`circle(${zoomedBoxSize / 2}px at center)`}
                transformOrigin={transformOrigin}
                transform={`scale(${zoom})`}
                transition={isZooming ? "transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)" : "none"}
            />
        </HStack>
    )
}

function makeCircularImage(url: string): Promise<{ dataUrl: string; size: number }> {
    return new Promise((resolve) => {
        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            const size = Math.min(img.width, img.height)
            const canvas = document.createElement("canvas")
            canvas.width = size
            canvas.height = size
            const ctx = canvas.getContext("2d")!
            ctx.beginPath()
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
            ctx.closePath()
            ctx.clip()
            ctx.drawImage(img, 0, 0, size, size)
            resolve({ dataUrl: canvas.toDataURL(), size })
        }
        img.src = url
    })
}
