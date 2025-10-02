"use client"

import { VStack, Text, Image, Spinner, HStack, useBreakpointValue } from "@chakra-ui/react"
import Link from "next/link"
import { useGetProjects } from "../../hooks/useGetProjects"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faDiscord, faDiscourse } from "@fortawesome/free-brands-svg-icons"

export default function LandingContainer() {
    const { projects, loading, error } = useGetProjects()
    const isMobile = useBreakpointValue({ base: true, sm: false })

    const SignalIndicator = ({
        signalName,
        icon,
        text,
        project,
    }: {
        signalName: string
        icon: any
        text: string
        project: ProjectData
    }) => {
        const isEnabled = project.signalStrengths.find((signal) => signal.name === signalName)?.enabled ?? false

        return (
            <HStack
                h={"100%"}
                py={1}
                px={3}
                borderRadius="full"
                border="2px solid"
                borderColor="contentBorder"
                gap={"6px"}
                opacity={isEnabled ? "1" : "0.2"}
            >
                <FontAwesomeIcon icon={icon} size="sm" />
                <Text>{text}</Text>
            </HStack>
        )
    }

    const ProjectCard = ({ project }: { project: ProjectData }) => {
        return (
            <Link href={`/p/${project.urlSlug}`} key={project.urlSlug}>
                <VStack
                    pb={3}
                    gap={3}
                    borderRadius="16px"
                    border="3px solid"
                    borderColor="button.secondary.default"
                    justifyContent="space-between"
                    bg="pageBackground"
                    w="400px"
                    maxW="90vw"
                >
                    <HStack
                        w={"100%"}
                        gap={4}
                        px={4}
                        pt={2}
                        pb={3}
                        justifyContent={{ base: "center", sm: "start" }}
                        bg={"button.secondary.default"}
                        borderTopRadius="10px"
                    >
                        <Image
                            src={project.projectLogoUrl}
                            alt={project.displayName}
                            boxSize="50px"
                            borderRadius="full"
                        />
                        <Text fontSize="3xl">{project.displayName}</Text>
                    </HStack>
                    <VStack h={{ base: "7.3em", sm: "6em" }}>
                        <Text
                            style={{
                                display: "-webkit-box",
                                WebkitLineClamp: isMobile ? 5 : 4, // number of lines
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}
                            w="100%"
                            fontSize="15px"
                            color="textColorMuted"
                            px={5}
                        >
                            {project.description}
                        </Text>
                    </VStack>
                    <HStack
                        px={4}
                        w={"100%"}
                        minH={"30px"}
                        flexWrap="wrap"
                        rowGap={3}
                        justifyContent={{ base: "center", sm: "space-between" }}
                    >
                        <HStack h={"100%"} bg="contentBackground" py={1} px={3} borderRadius="full" gap={"6px"}>
                            <Text fontSize="sm" fontWeight="bold">
                                {project.activeUsers}
                            </Text>
                            <Text fontSize="sm"> active users</Text>
                        </HStack>
                        <HStack>
                            <SignalIndicator signalName="discord" icon={faDiscord} text="Discord" project={project} />
                            <SignalIndicator
                                signalName="discourse_forum"
                                icon={faDiscourse}
                                text="Forum"
                                project={project}
                            />
                        </HStack>
                    </HStack>
                </VStack>
            </Link>
        )
    }

    return (
        <VStack gap={8} pt={8} maxW="100%" w={"1200px"}>
            <Text fontSize="3xl" fontWeight="bold" px={6} textAlign="center">
                High Signal Leaderboards
            </Text>
            {loading && <Spinner />}
            {error && <Text>Error loading projects</Text>}

            <HStack gap={8} flexWrap="wrap" justifyContent="center" maxW="100%">
                {!loading &&
                    projects &&
                    projects.length > 0 &&
                    projects
                        .sort((a, b) => (b.activeUsers ?? 0) - (a.activeUsers ?? 0))
                        .map((project: ProjectData) => <ProjectCard project={project} key={project.urlSlug} />)}
            </HStack>
        </VStack>
    )
}
