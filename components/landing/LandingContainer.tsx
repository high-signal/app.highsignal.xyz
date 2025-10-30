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
        return (
            <Link href={`/p/${project.urlSlug}`} key={project.urlSlug}>
                <VStack
                    gap={0}
                    borderRadius="32px"
                    border="4px solid"
                    borderColor="contentBorder"
                    justifyContent="space-between"
                    bg="contentBorder"
                    w="400px"
                    maxW="90vw"
                    overflow="hidden"
                >
                    <HStack w={"100%"} px={"3px"} pt={"2px"} mb={2} justifyContent={{ base: "center", sm: "start" }}>
                        <HStack
                            bg={"pageBackground"}
                            h={"50px"}
                            w={"100%"}
                            borderRadius="full"
                            justifyContent="start"
                            gap={4}
                        >
                            <Image
                                src={project.projectLogoUrl}
                                alt={project.displayName}
                                boxSize="50px"
                                borderRadius="full"
                            />
                            <Text fontSize="3xl" whiteSpace="normal" overflowWrap="break-word" wordBreak="break-word">
                                {project.displayName}
                            </Text>
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
                            const containerRef = useRef<HTMLDivElement | null>(null)
                            const [containerWidth, setContainerWidth] = useState<number>(0)

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

                            const high = project.highSignalUsers || 0
                            const mid = project.midSignalUsers || 0
                            const total = Math.max(1, high + mid)
                            const highPercent = (high / total) * 100
                            const midPercent = (mid / total) * 100

                            const heightPx = 25

                            const DotGroup = ({
                                count,
                                color,
                                widthPercent,
                            }: {
                                count: number
                                color: string
                                widthPercent: number
                            }) => {
                                const groupWidth = (containerWidth * widthPercent) / 100
                                const area = Math.max(1, groupWidth * heightPx)
                                const areaPerDot = area / Math.max(1, count)
                                const estimatedDiameter = Math.sqrt(areaPerDot / 3)
                                const dotSize = Math.max(3, Math.min(10, Math.floor(estimatedDiameter)))
                                const gap = Math.max(2, Math.floor(dotSize / 2))
                                return (
                                    <HStack
                                        h={`${heightPx}px`}
                                        w={`${widthPercent}%`}
                                        flexWrap="wrap"
                                        justifyContent="center"
                                        alignItems="center"
                                        alignContent="start"
                                        gap={`${gap}px`}
                                    >
                                        {Array.from({ length: count }).map((_, i) => (
                                            <Box key={i} boxSize={`${dotSize}px`} borderRadius="full" bg={color} />
                                        ))}
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
                                    {high > 0 && <DotGroup count={high} color="green.500" widthPercent={highPercent} />}
                                    {mid > 0 && <DotGroup count={mid} color="blue.500" widthPercent={midPercent} />}
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
        <VStack gap={8} pt={5} maxW="100%" w={"100%"}>
            <Text fontSize="3xl" fontWeight="bold" px={6} textAlign="center">
                High Signal Leaderboards
            </Text>
            {error && <Text>Error loading projects</Text>}
            <HStack gap={8} flexWrap="wrap" justifyContent="center" maxW="100%">
                {loading &&
                    [1, 2, 3, 4].map((item) => (
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
                        .sort((a, b) => (b.highSignalUsers ?? 0) - (a.highSignalUsers ?? 0))
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
