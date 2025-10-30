"use client"

import { VStack, Text, Image, HStack, useBreakpointValue, Button, Skeleton, Box } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useGetProjects } from "../../hooks/useGetProjects"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faDiscord, faDiscourse } from "@fortawesome/free-brands-svg-icons"
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons"

import SignalIndicator from "../ui/SignalIndicator"

export default function LandingContainer() {
    const { projects, loading, error } = useGetProjects()
    const isMobile = useBreakpointValue({ base: true, sm: false })

    const ProjectCard = ({ project }: { project: ProjectData }) => {
        const containerRef = useRef<HTMLDivElement | null>(null)
        const [containerWidth, setContainerWidth] = useState<number>(0)
        const [showHoverContent, setShowScoreLabel] = useState<boolean>(false)

        useEffect(() => {
            if (!containerRef.current) return
            const observer = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    const width = entry.contentRect.width
                    setContainerWidth(width)
                }
            })
            observer.observe(containerRef.current)
            return () => observer.disconnect()
        }, [])

        return (
            <Link href={`/p/${project.urlSlug}`} key={project.urlSlug}>
                <VStack
                    gap={0}
                    borderRadius="32px"
                    border="6px solid"
                    borderColor="contentBorder"
                    justifyContent="space-between"
                    bg="contentBorder"
                    w="400px"
                    maxW="90vw"
                    overflow="hidden"
                    onPointerEnter={(e) => {
                        if (e.pointerType !== "touch") setShowScoreLabel(true)
                    }}
                    onPointerLeave={(e) => {
                        if (e.pointerType !== "touch") setShowScoreLabel(false)
                    }}
                >
                    <HStack w={"100%"} px={"4px"} pt={"2px"} mb={2}>
                        <HStack
                            bg={"pageBackground"}
                            h={"50px"}
                            w={"100%"}
                            borderRadius="full"
                            justifyContent="space-between"
                            gap={2}
                        >
                            <HStack justifyContent="start" gap={3} flex="1" minW={0}>
                                <Image
                                    src={project.projectLogoUrl}
                                    alt={project.displayName}
                                    boxSize="50px"
                                    borderRadius="full"
                                />
                                <Text fontSize="3xl" truncate>
                                    {project.displayName}
                                </Text>
                            </HStack>
                            <HStack
                                minW={"max-content"}
                                border={"5px solid"}
                                h={"50px"}
                                borderRadius="full"
                                bg="pageBackground"
                                borderColor="green.500"
                                justifyContent="center"
                                alignItems="center"
                                gap={showHoverContent ? "6px" : 0}
                                px={2}
                            >
                                <HStack
                                    h={"100%"}
                                    borderRight={showHoverContent ? "5px solid" : "none"}
                                    borderColor="green.500"
                                >
                                    <Text
                                        fontWeight="bold"
                                        fontSize="xs"
                                        color="textColorMuted"
                                        lineHeight="1.2"
                                        textAlign="center"
                                        overflow="hidden"
                                        w={showHoverContent ? "80px" : 0}
                                        opacity={showHoverContent ? 1 : 0}
                                        transition={
                                            showHoverContent
                                                ? "width 0.3s ease, opacity 0.8s ease, margin 0.3s ease"
                                                : "width 0.3s ease, opacity 0.3s linear, margin 0.3s ease"
                                        }
                                        className="score-label"
                                        as="span"
                                        display="inline-block"
                                        mr={showHoverContent ? 1 : 0}
                                        whiteSpace="nowrap"
                                    >
                                        Community
                                        <br />
                                        Score
                                    </Text>
                                </HStack>
                                <Text fontSize="xl" fontWeight="bold">
                                    {project.averageScore?.toFixed(0)}
                                </Text>
                            </HStack>
                        </HStack>
                    </HStack>
                    <VStack gap={0} pb={1} bg={"pageBackground"} borderRadius="22px" w={"100%"} overflow="hidden">
                        <VStack
                            h={{ base: "7.3em", sm: "6em" }}
                            pt={2}
                            bg={"pageBackground"}
                            w={"100%"}
                            borderTopRadius="26px"
                        >
                            <Text
                                style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: isMobile ? 5 : 4, // number of lines
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    overflowWrap: "anywhere",
                                    wordBreak: "break-word",
                                }}
                                w="100%"
                                fontSize="15px"
                                color="textColorMuted"
                                px={5}
                            >
                                {project.description}
                            </Text>
                        </VStack>
                        <Box bg={"pageBackground"} h={3} w={"100%"} />
                        {(() => {
                            const high = project.highSignalUsers || 0
                            const mid = project.midSignalUsers || 0
                            const total = Math.max(1, high + mid)
                            const highPercent = (high / total) * 100
                            const midPercent = (mid / total) * 100

                            const heightPx = 40

                            const DotGroup = ({
                                type,
                                count,
                                color,
                                widthPercent,
                            }: {
                                type: "high" | "mid"
                                count: number
                                color: string
                                widthPercent: number
                            }) => {
                                // Account for horizontal padding on the container (px={5} on Chakra => ~40px)
                                const containerInnerWidth = Math.max(1, containerWidth - 40)
                                const groupWidth = Math.max(1, (containerInnerWidth * widthPercent) / 100)

                                // Guard against zero count
                                if (count <= 0) {
                                    return null
                                }

                                // Compute a grid that fits within groupWidth x heightPx
                                // Start by estimating number of columns using area ratio
                                const estimatedColumns = Math.ceil(
                                    Math.sqrt((count * groupWidth) / Math.max(1, heightPx)),
                                )
                                const columns = Math.max(1, estimatedColumns)
                                const cellSizeX = groupWidth / columns
                                const rows = Math.max(1, Math.ceil(count / columns))
                                const cellSizeY = heightPx / rows
                                const cellSize = Math.max(1, Math.floor(Math.min(cellSizeX, cellSizeY)))

                                // Gap as a fraction of cell size, ensuring non-negative sizes
                                const gap = Math.max(0, Math.floor(cellSize * 0.2))
                                const dotSize = Math.max(1, cellSize - gap)

                                return (
                                    <HStack
                                        h={`${heightPx}px`}
                                        w={`${widthPercent}%`}
                                        flexWrap="wrap"
                                        justifyContent="center"
                                        alignItems="center"
                                        alignContent="start"
                                        gap={`${gap}px`}
                                        position="relative"
                                    >
                                        {Array.from({ length: count }).map((_, i) => (
                                            <Box
                                                opacity={showHoverContent ? 0.1 : 1}
                                                key={i}
                                                boxSize={`${dotSize}px`}
                                                borderRadius="full"
                                                bg={color}
                                            />
                                        ))}
                                        <HStack
                                            position="absolute"
                                            left={0}
                                            top={0}
                                            w="100%"
                                            h="100%"
                                            display={showHoverContent ? "flex" : "none"}
                                            justifyContent="center"
                                            alignItems="start"
                                        >
                                            <Text
                                                fontWeight="bold"
                                                color={color}
                                                lineHeight="1.2"
                                                textAlign="center"
                                                fontSize="sm"
                                                whiteSpace="nowrap"
                                            >
                                                {type === "high" ? "High Signal" : "Mid Signal"}
                                                <br /> Users
                                            </Text>
                                        </HStack>
                                    </HStack>
                                )
                            }

                            return (
                                <HStack
                                    bg={"pageBackground"}
                                    ref={containerRef as any}
                                    w="100%"
                                    h={`${heightPx}px`}
                                    gap={high < 10 || mid < 10 ? "20px" : "4px"}
                                    px={5}
                                    justifyContent="center"
                                    alignItems="center"
                                >
                                    {high > 0 && (
                                        <DotGroup
                                            type="high"
                                            count={high}
                                            color="green.500"
                                            widthPercent={highPercent}
                                        />
                                    )}
                                    {mid > 0 && (
                                        <DotGroup type="mid" count={mid} color="blue.500" widthPercent={midPercent} />
                                    )}
                                </HStack>
                            )
                        })()}
                        <Box bg={"pageBackground"} h={1} w={"100%"} />

                        <VStack
                            bg={"pageBackground"}
                            px={4}
                            w={"100%"}
                            minH={"30px"}
                            flexWrap="wrap"
                            rowGap={3}
                            columnGap={0}
                            alignItems={{ base: "center", sm: "center" }}
                        >
                            <HStack
                                flexWrap="wrap"
                                justifyContent="center"
                                bg={"pageBackground"}
                                py={1}
                                w={"100%"}
                                borderTopRadius="16px"
                            >
                                <SignalIndicator
                                    signalName="discord"
                                    icon={faDiscord}
                                    text="Discord"
                                    project={project}
                                />
                                <SignalIndicator
                                    signalName="discourse_forum"
                                    icon={faDiscourse}
                                    text="Forum"
                                    project={project}
                                />
                            </HStack>
                        </VStack>
                    </VStack>
                </VStack>
            </Link>
        )
    }

    return (
        <VStack gap={8} pt={{ base: 3, sm: 0 }} maxW="100%" w={"100%"}>
            <Text fontSize="3xl" fontWeight="bold" px={6} textAlign="center">
                High Signal Leaderboards
            </Text>
            {error && <Text>Error loading projects</Text>}
            <HStack gap={8} flexWrap="wrap" justifyContent="center" maxW="100%">
                {loading &&
                    [1, 2, 3, 4, 5, 6].map((item) => (
                        <Skeleton
                            defaultSkeleton
                            key={item}
                            w="400px"
                            maxW="90vw"
                            h={{ base: "300px", sm: "277px" }}
                            borderRadius="16px"
                        />
                    ))}
                {!loading &&
                    projects &&
                    projects.length > 0 &&
                    projects
                        .sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0))
                        .map((project: ProjectData) => <ProjectCard project={project} key={project.urlSlug} />)}
            </HStack>
            <Link href="/new-project">
                <Button primaryButton pl={2} pr={3} py={2} borderRadius={"full"} mx={3}>
                    <FontAwesomeIcon icon={faPlusCircle} size="xl" />
                    <Text whiteSpace="normal" overflowWrap="break-word" wordBreak="break-word">
                        Add your project or community to High Signal
                    </Text>
                </Button>
            </Link>
        </VStack>
    )
}
