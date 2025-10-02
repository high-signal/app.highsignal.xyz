"use client"

import { VStack, HStack, Text, Image, Button, Box } from "@chakra-ui/react"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft, faExternalLink } from "@fortawesome/free-solid-svg-icons"

export default function Title({
    projectData,
    allLeaderboards,
    linkUrl,
}: {
    projectData: ProjectData
    allLeaderboards?: boolean
    linkUrl?: string
}) {
    const Content = () => {
        return (
            <VStack
                maxW="600px"
                justifyContent="center"
                gap={{ base: 5, lg: 0 }}
                _hover={linkUrl ? { textDecoration: "underline" } : {}}
                cursor={linkUrl ? "pointer" : "default"}
            >
                <HStack w="fit-content" justifyContent="center" gap={3} mt={{ base: 5, lg: 0 }}>
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
                    {linkUrl && (
                        <Box fontSize="20px">
                            <FontAwesomeIcon icon={faExternalLink} />
                        </Box>
                    )}
                </HStack>
            </VStack>
        )
    }

    return (
        <HStack
            position="relative"
            flexWrap="wrap"
            justifyContent="center"
            w="100%"
            maxW="1600px"
            gap={{ base: 0, sm: 2 }}
            flexDirection={{ base: "column", lg: "row" }}
        >
            <HStack
                justifyContent="center"
                alignItems="center"
                position={{ base: "relative", lg: "absolute" }}
                ml={{ base: "0px", lg: "50px", xl: "300px", "2xl": "300px" }}
                transform={{ base: "none", lg: "translateX(calc(-50vw + 50%))" }}
                h="40px"
                fontSize="lg"
                mt={{ base: "10px", lg: 0 }}
            >
                <Link href={allLeaderboards ? `/` : `/p/${projectData.urlSlug}${window.location.search}`}>
                    <Button
                        secondaryButton
                        gap={2}
                        px={3}
                        py={2}
                        w="auto"
                        maxW="100%"
                        borderRadius="full"
                        alignItems="center"
                        fontSize="xl"
                        whiteSpace="normal"
                        overflowWrap="break-word"
                        wordBreak="break-word"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        <Text fontSize="md" fontWeight={"normal"}>
                            View {allLeaderboards ? "all Leaderboards" : `${projectData.displayName} leaderboard`}
                        </Text>
                    </Button>
                </Link>
            </HStack>
            {linkUrl && (
                <Link href={linkUrl} target="_blank">
                    <Content />
                </Link>
            )}
            {!linkUrl && <Content />}
        </HStack>
    )
}
