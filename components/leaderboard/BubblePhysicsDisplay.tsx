"use client"

import { VStack, HStack, Text, Box, Table, Image, Spinner } from "@chakra-ui/react"
import { Tooltip } from "../../components/ui/tooltip"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { useGetUsers } from "../../hooks/useGetUsers"
import { ASSETS } from "../../config/constants"
import Matter from "matter-js"

export default function BubblePhysicsDisplay({ project }: { project: string }) {
    const { users, loading, error } = useGetUsers(project)
    const sceneRef = useRef<HTMLDivElement>(null)
    const engineRef = useRef<Matter.Engine | null>(null)
    const renderRef = useRef<Matter.Render | null>(null)
    const bodiesRef = useRef<Matter.Body[]>([])
    const [zoom, setZoom] = useState(1)

    const boxSize = 600
    const borderWidth = 5

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
                    width: sceneRef.current.clientWidth,
                    height: sceneRef.current.clientHeight,
                    wireframes: false,
                    background: "pageBackground",
                },
            })
            renderRef.current = render

            // Add mouse wheel event listener for zooming
            const handleWheel = (event: WheelEvent) => {
                event.preventDefault()
                const delta = event.deltaY
                const zoomFactor = 0.0005 // Reduced for finer control
                const newZoom = Math.max(1, Math.min(4, zoom - delta * zoomFactor))
                setZoom(newZoom)

                if (sceneRef.current) {
                    sceneRef.current.style.transform = `scale(${newZoom})`
                }
            }

            sceneRef.current.addEventListener("wheel", handleWheel, { passive: false })

            // Create circular boundary using small static bodies
            const circleCenter = { x: render.options.width! / 2, y: render.options.height! / 2 }
            const circleRadius = boxSize / 2 - borderWidth
            const wallThickness = 5
            const wallCount = 200
            const angleStep = (2 * Math.PI) / wallCount
            const walls = Array.from({ length: wallCount }, (_, i) => {
                const angle = i * angleStep
                const x = circleCenter.x + circleRadius * Math.cos(angle)
                const y = circleCenter.y + circleRadius * Math.sin(angle)
                return Matter.Bodies.rectangle(x, y, wallThickness, wallThickness, {
                    isStatic: true,
                    render: { visible: false },
                })
            })

            // Create user circles
            // const results = await Promise.all(
            //     users.map((user) => makeCircularImage(user.profileImageUrl || ASSETS.DEFAULT_PROFILE_IMAGE)),
            // )
            // TODO: Testing with duplicated users
            const duplicatedUsers = Array(10).fill(users).flat()
            const results = await Promise.all(
                duplicatedUsers.map((user) => makeCircularImage(user.profileImageUrl || ASSETS.DEFAULT_PROFILE_IMAGE)),
            )

            const bodies = results.map(({ dataUrl, size }) => {
                const x = Math.random() * (render.options.width! - 100) + 50
                const y = 350
                const radius = 20
                const scale = (radius * 2) / size

                const body = Matter.Bodies.circle(x, y, radius, {
                    restitution: 0.8,
                    friction: 0.2,
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
            Matter.World.add(engine.world, [...walls, ...bodies])

            // Run the engine
            Matter.Render.run(render)
            const runner = Matter.Runner.create()
            Matter.Runner.run(runner, engine)

            // Flip gravity after a short delay
            engine.gravity.y = -0.2

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
        <Box
            // width="400px"
            // height="400px"
            boxSize={`${boxSize}px`}
            border={`${borderWidth}px solid`}
            borderColor="gray.800"
            borderRadius="100%"
            overflow="hidden"
        >
            <Box
                ref={sceneRef}
                width="100%"
                height="100%"
                position="relative"
                borderRadius="100%"
                overflow="hidden"
                clipPath={`circle(${boxSize / 2}px at center)`}
                // border="5px solid"
                // borderColor="gray.800"
                // cursor="zoom-in"
                transformOrigin="center"
                transition="transform 0.05s ease-out"
            />
        </Box>
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
