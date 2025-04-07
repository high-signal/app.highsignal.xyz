"use client"

import { VStack, Text, HStack, Image } from "@chakra-ui/react"
import { keyframes } from "@emotion/react"
import Leaderboard from "./Leaderboard"
import { useGetProjects } from "../../hooks/useGetProjects"

export default function LeaderboardContainer({ project }: { project: string }) {
    const { projects, loading, error } = useGetProjects(project)

    const currentProject = projects[0]

    const pulseAnimation = keyframes`
        0% { background-color: var(--chakra-colors-gray-800); }
        50% { background-color: var(--chakra-colors-gray-700); }
        100% { background-color: var(--chakra-colors-gray-800); }
    `

    return (
        <VStack gap={5} w="100%" maxW="800px" borderRadius="20px">
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
                        <HStack gap={3}>
                            <Image
                                src={currentProject?.imageUrl}
                                alt={currentProject?.displayName}
                                boxSize="50px"
                                borderRadius="full"
                            />
                            <Text fontWeight="bold">{currentProject?.displayName} </Text>
                        </HStack>
                    </>
                ) : (
                    <HStack
                        w="200px"
                        my={"5px"}
                        h="40px"
                        bg="gray.800"
                        justifyContent="center"
                        borderRadius="full"
                        animation={`${pulseAnimation} 1s ease-in-out infinite`}
                        transition="background-color 0.5s ease-in-out"
                    >
                        {error && <Text fontSize="sm">Error: {error}</Text>}
                    </HStack>
                )}
                <Text>Signal Leaderboard</Text>
            </VStack>
            <Leaderboard project={project} />
        </VStack>
    )
}
