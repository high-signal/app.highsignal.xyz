"use client"

import { VStack, Text, Image, HStack, useBreakpointValue, Button, Skeleton } from "@chakra-ui/react"
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
                    pb={3}
                    gap={0}
                    borderRadius="16px"
                    border="3px solid"
                    borderColor="contentBorder"
                    justifyContent="space-between"
                    bg="pageBackground"
                    w="400px"
                    maxW="90vw"
                    overflow="hidden"
                >
                    <HStack
                        w={"100%"}
                        gap={4}
                        px={4}
                        pt={2}
                        pb={3}
                        justifyContent={{ base: "center", sm: "start" }}
                        bg={"contentBorder"}
                        borderTopRadius="10px"
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
                    <VStack h={{ base: "7.3em", sm: "6em" }} mt={2}>
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
                    <HStack w="100%" h="20px" gap={"2px"} my={1} px={"5px"}>
                        {(() => {
                            const total = project.activeUsers || 0
                            const high = project.highSignalUsers || 0
                            const mid = project.midSignalUsers || 0
                            const low = project.lowSignalUsers || 0

                            const highPercent = total > 0 ? (high / total) * 100 : 0
                            const midPercent = total > 0 ? (mid / total) * 100 : 0
                            const lowPercent = total > 0 ? (low / total) * 100 : 0

                            return (
                                <>
                                    {highPercent > 0 && (
                                        <HStack
                                            h="100%"
                                            bg="green.500"
                                            w={`${highPercent}%`}
                                            justifyContent="center"
                                            minW={highPercent > 5 ? "auto" : "2px"}
                                            borderRadius="8px"
                                        ></HStack>
                                    )}
                                    {midPercent > 0 && (
                                        <HStack
                                            h="100%"
                                            bg="blue.500"
                                            w={`${midPercent}%`}
                                            justifyContent="center"
                                            minW={midPercent > 5 ? "auto" : "2px"}
                                            opacity={1}
                                            borderRadius="8px"
                                        ></HStack>
                                    )}
                                    {lowPercent > 0 && (
                                        <HStack
                                            h="100%"
                                            bg="gray.500"
                                            w={`${lowPercent}%`}
                                            justifyContent="center"
                                            minW={lowPercent > 5 ? "auto" : "2px"}
                                            opacity={1}
                                            borderRadius="8px"
                                        ></HStack>
                                    )}
                                </>
                            )
                        })()}
                    </HStack>
                    <VStack
                        px={4}
                        pt={2}
                        w={"100%"}
                        minH={"30px"}
                        flexWrap="wrap"
                        rowGap={3}
                        columnGap={0}
                        alignItems={{ base: "center", sm: "center" }}
                    >
                        <HStack flexWrap="wrap" justifyContent="center">
                            <SignalIndicator signalName="discord" icon={faDiscord} text="Discord" project={project} />
                            <SignalIndicator
                                signalName="discourse_forum"
                                icon={faDiscourse}
                                text="Forum"
                                project={project}
                            />
                        </HStack>
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
                        .sort((a, b) => (b.activeUsers ?? 0) - (a.activeUsers ?? 0))
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
