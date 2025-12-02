"use client"

import { HStack, Text, Button, Box } from "@chakra-ui/react"
import Link from "next/link"

import { ColorModeToggle } from "../color-mode/ColorModeToggle"
import ParticleToggle from "../particle-animation/ParticleToggle"
import { FeedbackFish } from "@feedback-fish/react"
import { useUser } from "../../contexts/UserContext"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faMessage, faGlobe, faExternalLink } from "@fortawesome/free-solid-svg-icons"
import { faXTwitter } from "@fortawesome/free-brands-svg-icons"
import { EXTERNAL_LINKS } from "../../config/constants"

export default function Footer() {
    const { loggedInUser } = useUser()

    return (
        <HStack
            justifyContent={{ base: "center", md: "space-between" }}
            position="relative"
            w="100%"
            pb={2}
            px={4}
            flexWrap={"wrap-reverse"}
            columnGap={{ base: 3, md: 10 }}
            rowGap={5}
        >
            <HStack
                alignItems={"center"}
                gap={1}
                justifyContent={{ base: "space-between", md: "center" }}
                h={"28px"}
                justifySelf={"center"}
            >
                <Box
                    flexGrow={1}
                    w={{ base: "100%", md: process.env.NEXT_PUBLIC_FEEDBACK_FISH_PROJECT_ID ? "auto" : "166px" }}
                >
                    {process.env.NEXT_PUBLIC_FEEDBACK_FISH_PROJECT_ID && (
                        <FeedbackFish
                            projectId={process.env.NEXT_PUBLIC_FEEDBACK_FISH_PROJECT_ID}
                            userId={loggedInUser?.username || "anonymous"}
                        >
                            <Button secondaryButton px={3} py={1} borderRadius={"full"}>
                                <HStack>
                                    <Text>Give us feedback</Text>
                                    <FontAwesomeIcon icon={faMessage} />
                                </HStack>
                            </Button>
                        </FeedbackFish>
                    )}
                </Box>
            </HStack>
            <HStack fontWeight={"bold"} fontSize={"14px"} textAlign={"center"} gap={1}>
                <Text color={"textColorMuted"}>Built with ❤️ by </Text>
                <Link href={"https://eridian.xyz"} target="_blank">
                    <HStack textDecoration={"underline"} color={"blue.500"} gap={"2px"}>
                        <Text>Eridian</Text>
                    </HStack>
                </Link>
            </HStack>
            <HStack
                gap={{ base: 5, md: 8 }}
                w={{ base: "100%", md: "auto" }}
                justifyContent={{ base: "center", md: "end" }}
            >
                <HStack gap={3}>
                    <Link href={EXTERNAL_LINKS.website.url} target="_blank">
                        <Button
                            secondaryButton
                            borderRadius={"full"}
                            h={"28px"}
                            minW={"28px"}
                            aria-label={EXTERNAL_LINKS.website.label}
                        >
                            <FontAwesomeIcon icon={faGlobe} size="lg" />
                        </Button>
                    </Link>
                    <Link href={EXTERNAL_LINKS.X.url} target="_blank">
                        <Button
                            secondaryButton
                            borderRadius={"full"}
                            h={"28px"}
                            minW={"28px"}
                            aria-label={EXTERNAL_LINKS.X.label}
                        >
                            <FontAwesomeIcon icon={faXTwitter} size="lg" />
                        </Button>
                    </Link>
                </HStack>
                <HStack gap={3}>
                    <ParticleToggle />
                    <ColorModeToggle />
                </HStack>
            </HStack>
        </HStack>
    )
}
