"use client"

import { VStack, HStack, Text, Image, Button } from "@chakra-ui/react"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"
import SharedAccountsContainer from "./SharedAccountsContainer"

import { useParams } from "next/navigation"
import { useUser } from "../../contexts/UserContext"

export default function Title({ projectData }: { projectData: ProjectData }) {
    const { loggedInUser } = useUser()
    const params = useParams()
    const targetUsername = params.username as string
    const isOwner = loggedInUser?.username === targetUsername

    return (
        <HStack
            position="relative"
            flexWrap="wrap"
            justifyContent="center"
            w="100%"
            maxW="1600px"
            pb={5}
            pt={0}
            gap={{ base: 5, sm: 2 }}
            flexDirection={{ base: "column", xl: "row" }}
        >
            <HStack
                justifyContent={"center"}
                position={{ base: "relative", xl: "absolute" }}
                left={{ base: undefined, xl: "-60" }}
                top={{ base: undefined, xl: "4" }}
                zIndex={1}
            >
                <Link href={`/p/${projectData.urlSlug}${window.location.search}`}>
                    <Button
                        secondaryButton
                        gap={2}
                        px={3}
                        py={2}
                        w="auto"
                        maxW={"300px"}
                        borderRadius="full"
                        alignItems="center"
                        fontSize="xl"
                        whiteSpace="normal"
                        overflowWrap="break-word"
                        wordBreak="break-word"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        <Text fontSize="md" fontWeight={"normal"}>
                            View {projectData.displayName} leaderboard
                        </Text>
                    </Button>
                </Link>
            </HStack>
            <VStack maxW="600px" justifyContent="center" gap={{ base: 5, xl: 0 }}>
                <HStack w="fit-content" justifyContent="center" gap={3} mt={{ base: 5, xl: 0 }}>
                    <Image
                        src={projectData.projectLogoUrl}
                        alt={projectData.displayName}
                        boxSize="50px"
                        borderRadius="full"
                    />
                    <Text
                        fontSize={{
                            base: projectData.displayName.length >= 16 ? "2xl" : "3xl",
                            sm: "5xl",
                        }}
                        textAlign="center"
                        fontWeight="bold"
                        whiteSpace="normal"
                        overflowWrap="break-word"
                        wordBreak="break-word"
                    >
                        {projectData.displayName}
                    </Text>
                </HStack>
                {isOwner && <SharedAccountsContainer projectData={projectData} />}
            </VStack>
        </HStack>
    )
}
