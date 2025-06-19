"use client"

import { VStack, Text, Image, Spinner, Button } from "@chakra-ui/react"
import Link from "next/link"
import { useGetProjects } from "../../hooks/useGetProjects"

export default function LandingContainer() {
    const { projects, loading, error } = useGetProjects()

    return (
        <VStack gap={5} pt={8}>
            <Text fontSize="3xl" fontWeight="bold" px={6} textAlign="center">
                High Signal Leaderboards
            </Text>
            {loading && <Spinner />}
            {error && <Text>Error loading projects</Text>}
            {!loading &&
                projects &&
                projects.length > 0 &&
                projects.map((project: ProjectData) => (
                    <Link href={`/p/${project.urlSlug}`} key={project.urlSlug}>
                        <Button
                            secondaryButton
                            p={3}
                            pr={4}
                            borderRadius="full"
                            bg="pageBackground"
                            border="3px solid"
                            borderColor="contentBorder"
                            justifyContent="center"
                            _hover={{
                                bg: "button.secondary.default",
                            }}
                        >
                            <Image
                                src={project.projectLogoUrl}
                                alt={project.displayName}
                                boxSize="50px"
                                borderRadius="full"
                            />
                            <Text fontSize="3xl">{project.displayName}</Text>
                        </Button>
                    </Link>
                ))}
        </VStack>
    )
}
