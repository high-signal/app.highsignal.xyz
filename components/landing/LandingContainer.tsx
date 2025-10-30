"use client"

import { VStack, Text, Image, HStack, useBreakpointValue, Button, Skeleton, Box } from "@chakra-ui/react"
import { useState } from "react"
import Link from "next/link"
import { useGetProjects } from "../../hooks/useGetProjects"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faDiscord, faDiscourse } from "@fortawesome/free-brands-svg-icons"
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons"

import SignalIndicator from "../ui/SignalIndicator"
import UserSignalDotsBar from "../ui/UserSignalDotsBar"

export default function LandingContainer() {
    const { projects, loading, error } = useGetProjects()
    const isMobile = useBreakpointValue({ base: true, sm: false })

    const ProjectCard = ({ project }: { project: ProjectData }) => {
        const [showHoverContent, setShowScoreLabel] = useState<boolean>(false)

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
                        <Box bg={"pageBackground"} px={5}>
                            <UserSignalDotsBar
                                highCount={project.highSignalUsers || 0}
                                midCount={project.midSignalUsers || 0}
                                showHoverContent={showHoverContent}
                                heightPx={40}
                            />
                        </Box>
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
                                rowGap={1}
                                columnGap={2}
                            >
                                <Text fontSize="sm" fontWeight="bold" color="textColorMuted">
                                    Signals used
                                </Text>
                                <HStack gap={2}>
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
                            </HStack>
                        </VStack>
                    </VStack>
                </VStack>
            </Link>
        )
    }

    return (
        <VStack gap={5} pt={{ base: 3, sm: 0 }} maxW="100%" w={"100%"}>
            <Text fontSize="3xl" fontWeight="bold" px={6} textAlign="center">
                High Signal Leaderboards
            </Text>
            {error && <Text>Error loading projects</Text>}
            <HStack gap={6} flexWrap="wrap" justifyContent="center" maxW="100%">
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
