"use client"

import { VStack, Text, HStack, Image, Skeleton } from "@chakra-ui/react"
import { useGetProjects } from "../../hooks/useGetProjects"
import BubbleDisplay from "./BubbleDisplay"

export default function TestingContainer() {
    const { projects, loading, error } = useGetProjects("lido")

    const currentProject = projects[0]

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
                                src={currentProject?.projectLogoUrl}
                                alt={currentProject?.displayName}
                                boxSize="50px"
                                borderRadius="full"
                            />
                            <Text fontWeight="bold">{currentProject?.displayName} </Text>
                        </HStack>
                    </>
                ) : (
                    <HStack w="200px" my={"5px"} h="40px" justifyContent="center">
                        {error ? (
                            <Text fontSize="sm">Error: {error}</Text>
                        ) : (
                            <Skeleton defaultSkeleton height="40px" width="200px" borderRadius="full" />
                        )}
                    </HStack>
                )}
            </VStack>
            {currentProject && <BubbleDisplay project={currentProject} isSlider={true} />}
        </VStack>
    )
}
