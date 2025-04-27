"use client"

import { HStack, Text, Box, Spinner, useBreakpointValue, useToken, Slider } from "@chakra-ui/react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useGetUsers } from "../../hooks/useGetUsers"
import { ASSETS, APP_CONFIG } from "../../config/constants"
import Matter from "matter-js"
import { calculateRings } from "../../utils/bubble-utils/ringCalculations"
import { useZoom } from "../../utils/bubble-utils/handleZoom"
import { useDebounce } from "../../hooks/useDebounce"

function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== "undefined" ? window.innerWidth : 600,
        height: typeof window !== "undefined" ? window.innerHeight : 600,
    })

    useEffect(() => {
        function handleResize() {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            })
        }

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    return windowSize
}

interface BodyWithElement extends Matter.Body {
    element: HTMLDivElement
}

export default function BubbleDisplay({ project, isSlider = false }: { project: ProjectData; isSlider: boolean }) {
    const initialZoom = 1
    const physicsDuration = 8000 // TODO: Make this dynamic based on the number of circles
    const { width: windowWidth } = useWindowSize()
    const boxSize = Math.min(windowWidth - 40, 600)
    const minSpacing = useBreakpointValue({ base: 15, sm: 25 }) || 25

    const [userMultiplier, setUserMultiplier] = useState(1)
    const debouncedMultiplier = useDebounce(userMultiplier, 500)
    const engineRef = useRef<Matter.Engine | null>(null)
    const renderRef = useRef<Matter.Render | null>(null)
    const [spriteCssText, setSpriteCssText] = useState("")

    const [isCanvasLoading, setIsCanvasLoading] = useState(true)

    const { users, loading, error } = useGetUsers(project.projectSlug)
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

            const borderWidth = Math.round(Math.min(Math.max(circleRadius / 5, 1), 8))
            const profileImageWidth = APP_CONFIG.IMAGE_UPLOAD_WIDTH
            const spriteWidth = Math.round(circleRadius * 2 - borderWidth * 2)

            const loadSpriteCss = async () => {
                try {
                    const spriteUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/sprite/w_${profileImageWidth},h_${profileImageWidth},c_fit/profile_image`

                    const cssUrl = `${spriteUrl}.css`
                    console.log("Loading sprite CSS from:", cssUrl)
                    const response = await fetch(cssUrl)
                    if (response.ok) {
                        const cssText = await response.text()

                        setSpriteCssText(cssText)
                        // Ensure the CSS has the correct protocol
                        const processedCssText = cssText.replace(/url\('\/\//g, "url('https://")
                        const style = document.createElement("style")
                        style.textContent = processedCssText
                        style.id = "profile-images-sprite"
                        // Remove any existing sprite styles
                        const existingStyle = document.getElementById("profile-images-sprite")
                        if (existingStyle) {
                            existingStyle.remove()
                        }
                        document.head.appendChild(style)
                        console.log("Sprite CSS loaded successfully")
                    } else {
                        console.error("Failed to load sprite CSS:", response.status, response.statusText)
                    }
                } catch (error) {
                    console.error("Failed to load sprite CSS:", error)
                }
            }

            await loadSpriteCss()

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
                element.style.border = `${borderWidth}px solid`
                element.style.borderColor = scoreColors[user.signal as SignalType]

                // Add the image using a sprite
                const img = document.createElement("div")
                if (user.profileImageUrl && user.profileImageUrl != ASSETS.DEFAULT_PROFILE_IMAGE) {
                    // Extract the public ID from the profile image URL
                    const publicId = user.profileImageUrl.split("/").pop()?.split(".")[0]
                    const cssId = `profile-images-${user.id}-${publicId}`

                    // Check if the classId exists in the css on the document
                    // TODO: See if this check is happening before the sprite is loaded
                    // as sometimes it looks like it is using the default profile image
                    // when the sprite does contain the classId
                    if (!spriteCssText.includes(cssId)) {
                        // TODO: Refactor this duplicated code (PART 1)
                        img.style.backgroundImage = `url(${ASSETS.DEFAULT_PROFILE_IMAGE})`
                        img.style.backgroundSize = "cover"
                        img.style.width = "100%"
                        img.style.height = "100%"
                        element.appendChild(img)
                    } else {
                        // Create a wrapper div for scaling
                        const wrapper = document.createElement("div")
                        wrapper.style.width = `${spriteWidth}px`
                        wrapper.style.height = `${spriteWidth}px`
                        wrapper.style.overflow = "hidden"
                        wrapper.style.position = "relative"

                        // Set up the sprite image
                        img.className = cssId
                        img.style.position = "absolute"
                        img.style.transform = `scale(${spriteWidth / profileImageWidth})`
                        img.style.transformOrigin = "0 0"

                        wrapper.appendChild(img)
                        element.appendChild(wrapper)
                    }
                } else {
                    // TODO: Refactor this duplicated code (PART 2)
                    img.style.backgroundImage = `url(${ASSETS.DEFAULT_PROFILE_IMAGE})`
                    img.style.backgroundSize = "cover"
                    img.style.width = "100%"
                    img.style.height = "100%"
                    element.appendChild(img)
                }

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

            const wallRadius = Math.round(Math.max(boxSize / 12, 50))

            // Create a custom HTML element for the wall
            const element = document.createElement("div")
            element.style.width = `${wallRadius * 2 - 10}px`
            element.style.height = `${wallRadius * 2 - 10}px`
            element.style.borderRadius = "50%"
            element.style.overflow = "hidden"
            element.style.cursor = "default"
            element.style.position = "absolute"
            element.style.transform = "translate(-50%, -50%)"

            // Add the image
            const img = document.createElement("img")
            img.src = project.imageUrl
            img.style.width = "100%"
            img.style.height = "100%"
            img.style.objectFit = "cover"
            element.appendChild(img)

            // Add the element to the scene
            containerRef.current?.appendChild(element)

            // Add central wall
            const wall = Matter.Bodies.circle(center.x, center.y, wallRadius, {
                isStatic: true,
                render: {
                    visible: false,
                },
            }) as BodyWithElement

            // Store reference to the element
            wall.element = element

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
                // Update wall position
                if (wall.element) {
                    wall.element.style.left = `${wall.position.x}px`
                    wall.element.style.top = `${wall.position.y}px`
                }

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
    }, [users, debouncedMultiplier, cleanupPhysics, boxSize])

    if (loading) return <Spinner />
    if (error) return <Text color="red.500">Error loading users</Text>

    return (
        <Box>
            {isSlider && (
                <>
                    <Box h={"20px"} />
                    <Slider.Root
                        defaultValue={[1]}
                        min={1}
                        max={200}
                        step={1}
                        value={[userMultiplier]}
                        onValueChange={({ value }) => setUserMultiplier(value[0])}
                    >
                        <Slider.Control>
                            <Slider.Track cursor="pointer">
                                <Slider.Range />
                            </Slider.Track>
                            <Slider.Thumb index={0} cursor="pointer">
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
                                    cursor="default"
                                >
                                    {userMultiplier}x
                                </Box>
                            </Slider.Thumb>
                        </Slider.Control>
                        <Slider.Label>User Multiplier</Slider.Label>
                    </Slider.Root>
                </>
            )}
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
