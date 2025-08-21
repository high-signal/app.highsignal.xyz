/* eslint-disable react-hooks/exhaustive-deps */
// TODO: Fix these eslint rule warnings properly

"use client"

import {
    HStack,
    VStack,
    Text,
    Box,
    Image,
    useBreakpointValue,
    useToken,
    Slider,
    Skeleton,
    Span,
} from "@chakra-ui/react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useGetUsers } from "../../hooks/useGetUsers"
import { ASSETS, APP_CONFIG } from "../../config/constants"
import Matter from "matter-js"
import { calculateRings } from "../../utils/bubble-utils/ringCalculations"
import { useZoom } from "../../utils/bubble-utils/handleZoom"
import { useDebounce } from "../../hooks/useDebounce"

import { useUser } from "../../contexts/UserContext"

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

export default function BubbleDisplay({ project }: { project: ProjectData }) {
    const [hoveredUser, setHoveredUser] = useState<UserData | null>(null)
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)

    // Function to update mouse position
    const updateMousePosition = (event: MouseEvent) => {
        setMousePosition({ x: event.clientX, y: event.clientY })
    }

    useEffect(() => {
        if (hoveredUser) {
            window.addEventListener("mousemove", updateMousePosition)
        } else {
            setMousePosition(null)
        }

        return () => {
            window.removeEventListener("mousemove", updateMousePosition)
        }
    }, [hoveredUser])

    const initialZoom = 1
    const physicsDuration = 8000 // TODO: Make this dynamic based on the number of circles
    const { width: windowWidth, height: windowHeight } = useWindowSize()
    const boxSize = Math.min(windowWidth - 40, windowHeight * 0.7)
    const minSpacing = useBreakpointValue({ base: 15, sm: 25 }) || 25

    const [userMultiplier, setUserMultiplier] = useState(1)
    const debouncedMultiplier = useDebounce(userMultiplier, 500)
    const engineRef = useRef<Matter.Engine | null>(null)
    const renderRef = useRef<Matter.Render | null>(null)
    const [spriteCssText, setSpriteCssText] = useState("")

    const [isCanvasLoading, setIsCanvasLoading] = useState(true)

    const wallRadius = Math.round(Math.max(boxSize / 12, 50))

    const { loggedInUser, loggedInUserLoading } = useUser()

    const { users, loading, error } = useGetUsers({
        project: project.urlSlug,
        leaderboardOnly: true,
        pageSize: 1000,
    })
    const { zoom, transformOrigin, isZooming, handleWheel, containerRef } = useZoom({
        initialZoom,
        maxZoom: 5,
        zoomStep: 0.2,
    })

    const profileImageWidth = APP_CONFIG.IMAGE_UPLOAD_WIDTH

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
        const loadSpriteCss = async () => {
            // TODO: Increment version ID when a profile image is updated
            const versionId = 12

            try {
                const spriteUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/sprite/w_${profileImageWidth},h_${profileImageWidth},c_fit/v${versionId}/profile_image`

                const cssUrl = `${spriteUrl}.css`
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
                } else {
                    console.error("Failed to load sprite CSS:", response.status, response.statusText)
                    setSpriteCssText("ERROR")
                }
            } catch (error) {
                console.error("Failed to load sprite CSS:", error)
            }
        }

        loadSpriteCss()
    }, [])

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
            const filteredUsers = users.filter((user) => user.score !== 0 || user.username === loggedInUser?.username)
            const duplicatedUsers = Array(debouncedMultiplier).fill(filteredUsers).flat()

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
            const spriteWidth = Math.round(circleRadius * 2 - borderWidth * 2)

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

                const isCurrentUser = user.username === loggedInUser?.username

                // Create a custom HTML element for the circle
                const element = document.createElement("div")
                element.addEventListener("mouseenter", () => setHoveredUser(user))
                element.addEventListener("mouseleave", () => setHoveredUser(null))
                element.style.width = `${circleRadius * 2 - 2}px`
                element.style.height = `${circleRadius * 2 - 2}px`
                element.style.borderRadius = "50%"
                element.style.overflow = "hidden"
                element.style.cursor = "pointer"
                element.style.position = "absolute"
                element.style.transform = "translate(-50%, -50%)"
                element.style.border = `${borderWidth}px solid`

                if (user.lastChecked) {
                    element.className = "rainbow-border-animation"
                } else {
                    element.style.borderColor = isCurrentUser ? "gold" : scoreColors[user.signal as SignalType]
                }
                // Add the image using a sprite
                const img = document.createElement("div")
                if (user.profileImageUrl && user.profileImageUrl != ASSETS.DEFAULT_PROFILE_IMAGE) {
                    // Extract the public ID from the profile image URL
                    const publicId = user.profileImageUrl.split("/").pop()?.split(".")[0]

                    // Check if the classId exists in the css on the document
                    if (!spriteCssText.includes(publicId)) {
                        // TODO: Refactor this duplicated code (PART 1)
                        img.style.backgroundImage = `url(${ASSETS.DEFAULT_PROFILE_IMAGE})`
                        img.style.backgroundSize = "cover"
                        img.style.width = "100%"
                        img.style.height = "100%"
                        img.style.opacity = "0.4"
                        element.appendChild(img)
                    } else {
                        // Find the css class for the publicId
                        const cssClass =
                            spriteCssText.match(new RegExp(`\\.profile-images-\\d+-${publicId}\\b`))?.[0]?.slice(1) ||
                            ""

                        // Create a wrapper div for scaling
                        const wrapper = document.createElement("div")
                        wrapper.style.width = `${spriteWidth}px`
                        wrapper.style.height = `${spriteWidth}px`
                        wrapper.style.overflow = "hidden"
                        wrapper.style.position = "relative"

                        // Set up the sprite image
                        img.className = cssClass
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
                    img.style.opacity = "0.4"
                    element.appendChild(img)
                }

                // Add click handler
                element.addEventListener("click", () => {
                    window.open(`/p/${project?.urlSlug}/${user.username}${window.location.search}`, "_blank")
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
            img.src = project.projectLogoUrl
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

        if (spriteCssText && !loggedInUserLoading) {
            setupPhysics()
        }

        // Reset the hovered user when any of the dependencies change
        setHoveredUser(null)
    }, [users, debouncedMultiplier, cleanupPhysics, boxSize, spriteCssText, loggedInUserLoading])

    if (loading)
        return (
            <VStack justifyContent="center" alignItems="center" h={boxSize}>
                <Skeleton defaultSkeleton height={wallRadius * 2} width={wallRadius * 2} borderRadius="full" />
            </VStack>
        )
    if (error) return <Text color="red.500">Error loading users</Text>

    return (
        <Box>
            {/* Display hovered username near the mouse pointer */}
            {hoveredUser && mousePosition && (
                <VStack
                    position="fixed"
                    left={`${mousePosition.x}px`}
                    top={`${mousePosition.y - 10}px`}
                    bg="contentBackground"
                    px={4}
                    py={3}
                    borderRadius="30px"
                    border="5px solid"
                    borderColor="contentBorder"
                    pointerEvents="none"
                    transform="translateX(-50%) translateY(-100%)"
                    // TODO: The header covers this tooltip
                    zIndex={10}
                    gap={2}
                >
                    <HStack>
                        <Box boxSize="50px" minW="50px" borderRadius="full" overflow="hidden" flexGrow={0}>
                            <Image
                                src={
                                    !hoveredUser.profileImageUrl || hoveredUser.profileImageUrl === ""
                                        ? ASSETS.DEFAULT_PROFILE_IMAGE
                                        : hoveredUser.profileImageUrl
                                }
                                alt={`User ${hoveredUser.displayName} Profile Image`}
                                fit="cover"
                            />
                        </Box>
                        <Text fontWeight={"bold"} fontSize={"xl"}>
                            {hoveredUser.displayName}
                        </Text>
                    </HStack>
                    {hoveredUser.lastChecked ? (
                        <HStack
                            gap={3}
                            py={1}
                            px={3}
                            w={"100%"}
                            maxW={"150px"}
                            border={"3px solid"}
                            borderRadius={"10px"}
                            borderColor={"contentBorder"}
                            justifyContent={"center"}
                            className="rainbow-animation"
                        >
                            <Text fontWeight={"bold"} color="white" textAlign={"center"} fontSize={"md"}>
                                Updating...
                            </Text>
                        </HStack>
                    ) : (
                        <VStack
                            justifyContent={"center"}
                            alignItems={"center"}
                            gap={3}
                            fontWeight="bold"
                            pb={2}
                            w={"100%"}
                            flexWrap={"wrap"}
                            fontSize={"2xl"}
                        >
                            <Text textAlign={"center"}>
                                <Span color={`scoreColor.${hoveredUser.signal || "gray.500"}`}>
                                    {(hoveredUser.signal || "").charAt(0).toUpperCase() +
                                        (hoveredUser.signal || "").slice(1)}
                                </Span>{" "}
                                Signal
                            </Text>
                            <Text
                                px={4}
                                py={1}
                                bg={"pageBackground"}
                                border={"5px solid"}
                                borderRadius="25px"
                                borderColor={`scoreColor.${hoveredUser.signal}`}
                            >
                                {hoveredUser.score}
                            </Text>
                        </VStack>
                    )}
                </VStack>
            )}
            {false && (
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
                borderColor="contentBorder"
                borderRadius="100%"
                overflow="hidden"
                justifyContent="center"
                alignItems="center"
                position="relative"
            >
                {/* {isCanvasLoading && (
                    <VStack justifyContent="center" alignItems="center" h={boxSize}>
                        <Skeleton defaultSkeleton height={wallRadius * 2} width={wallRadius * 2} borderRadius="full" />
                    </VStack>
                )} */}
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
