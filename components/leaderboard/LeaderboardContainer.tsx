"use client"

import { VStack, Text, HStack, Image, Skeleton, Spinner } from "@chakra-ui/react"
import Leaderboard from "./Leaderboard"
import { useGetProjects } from "../../hooks/useGetProjects"
import AcmeIncPlaceholder from "../ui/AcmeIncPlaceholder"

export default function LeaderboardContainer({ project }: { project: string }) {
    const { projects, loading, error } = useGetProjects(project)

    const currentProject = projects[0]

    // Display placeholder for example project
    if (currentProject?.urlSlug === "acme-inc") {
        return <AcmeIncPlaceholder projectData={currentProject} />
    }

    return (
        <VStack gap={5} w="100%" maxW="650px" borderRadius="20px">
            <VStack
                fontSize="3xl"
                px={6}
                pt={6}
                w="100%"
                textAlign="center"
                gap={5}
                flexWrap="wrap"
                justifyContent="center"
            >
                {!loading && !error ? (
                    <>
                        <HStack gap={3} h="50px">
                            <Image
                                src={currentProject?.projectLogoUrl}
                                alt={currentProject?.displayName}
                                boxSize="50px"
                                borderRadius="full"
                            />
                            <Text
                                fontWeight="bold"
                                whiteSpace="normal"
                                overflowWrap="break-word"
                                wordBreak="break-word"
                                fontSize={{
                                    base: currentProject.displayName.length >= 16 ? "2xl" : "3xl",
                                    sm: "4xl",
                                }}
                            >
                                {currentProject?.displayName}{" "}
                            </Text>
                        </HStack>
                    </>
                ) : (
                    <HStack w="200px" h="50px" justifyContent="center">
                        {error ? (
                            <Text fontSize="sm">Error: {error}</Text>
                        ) : (
                            <Skeleton defaultSkeleton height="100%" width="200px" borderRadius="full" />
                        )}
                    </HStack>
                )}
                <Text>Signal Leaderboard</Text>
            </VStack>
            {loading ? <Spinner /> : currentProject && <Leaderboard project={currentProject} />}
        </VStack>
    )
}
