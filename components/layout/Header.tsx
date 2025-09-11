"use client"

import { HStack, Image, Text, Box, VStack, Button } from "@chakra-ui/react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXTwitter, IconDefinition } from "@fortawesome/free-brands-svg-icons"

import UserMenuButton from "./UserMenuButton"

import { ASSETS, EXTERNAL_LINKS } from "../../config/constants"
import { useParticles } from "../../contexts/ParticleContext"
import { useUser } from "../../contexts/UserContext"
import ProjectPicker from "../ui/ProjectPicker"
import UserPicker from "../ui/UserPicker"

const iconMap = {
    faXTwitter,
}

const socialLinks = Object.values(EXTERNAL_LINKS).map((link) => ({
    href: link.url,
    label: link.label,
    icon: iconMap[link.icon as keyof typeof iconMap],
}))

const IconLinkButton = ({ href, label, icon }: { href: string; label: string; icon: IconDefinition }) => {
    return (
        <Link href={href} target="_blank">
            <HStack
                color={"textColor"}
                _hover={{
                    bg: "contentBackground",
                }}
                borderRadius="full"
                aria-label={label}
                boxSize={"40px"}
                justifyContent={"center"}
                alignItems={"center"}
            >
                <FontAwesomeIcon icon={icon} size={"lg"} />
            </HStack>
        </Link>
    )
}

const environmentName =
    process.env.NODE_ENV === "development"
        ? "Dev"
        : process.env.NEXT_PUBLIC_SITE_URL?.includes("staging")
          ? "Staging"
          : "Prod"

export default function Header({}) {
    const { showParticles } = useParticles()
    const router = useRouter()
    const { loggedInUser } = useUser()

    return (
        <VStack
            bg={"pageBackground"}
            gap={0}
            w="100%"
            justifyContent={"center"}
            alignItems={"center"}
            zIndex={5}
            position={"relative"}
            borderBottom={"1px solid"}
            transition={showParticles ? "border-color 0.5s ease-in" : "none"}
            borderColor={showParticles ? "contentBorder" : "transparent"}
        >
            {environmentName !== "Prod" && (
                <HStack
                    w="100%"
                    justifyContent={"center"}
                    alignItems={"center"}
                    bg={environmentName === "Dev" ? "orange.700" : "green.700"}
                    zIndex={3}
                >
                    <Text>{environmentName} Environment</Text>
                </HStack>
            )}
            <HStack
                w="100%"
                maxW="1400px"
                pt={2}
                pb={2}
                justifyContent={"space-between"}
                alignItems={"center"}
                px={3}
                gap={{ base: 3, md: 0 }}
            >
                <HStack gap={{ base: 3, md: 10 }} flexGrow={1}>
                    <Link href="/">
                        <Box>
                            <HStack gap={2} justifyContent={"center"} alignItems={"center"}>
                                <Image
                                    src={`${ASSETS.LOGO_BASE_URL}/w_300,h_300,c_fill,q_auto,f_webp/${ASSETS.LOGO_ID}`}
                                    alt="Logo"
                                    boxSize={"50px"}
                                    minW={"50px"}
                                    borderRadius="full"
                                />
                                <Text
                                    minW="80px"
                                    fontWeight="bold"
                                    fontSize="xl"
                                    whiteSpace={"nowrap"}
                                    display={{ base: "none", md: "block" }}
                                >
                                    {process.env.NEXT_PUBLIC_SITE_NAME}
                                </Text>
                            </HStack>
                        </Box>
                    </Link>
                    <HStack flexGrow={{ base: 1, md: 0 }} justifyContent={"center"} gap={2}>
                        <Box display={{ base: loggedInUser ? "block" : "none", md: "block" }}>
                            <ProjectPicker
                                onProjectSelect={(project) => {
                                    if (project?.urlSlug) {
                                        router.push(`/p/${project.urlSlug}`)
                                    }
                                }}
                                selectorText={"Leaderboards..."}
                                placeholder={"Search..."}
                            />
                        </Box>
                        <Box display={{ base: "none", lg: "block" }}>
                            <UserPicker
                                projectUrlSlug={""}
                                selectorText={"Users..."}
                                placeholder={"Search..."}
                                signalStrengths={[]}
                                onUserSelect={(user) => {
                                    if (user?.username) {
                                        router.push(`/u/${user.username}`)
                                    }
                                }}
                            />
                        </Box>
                    </HStack>
                </HStack>
                <HStack gap={{ base: 2, md: 6 }} alignItems={"center"}>
                    {/* <HStack direction="row" wrap="wrap" gap={2} justifyContent="right" pr={{ base: 0, md: 2 }}>
                        {socialLinks.map((link, index) => (
                            <IconLinkButton key={index} {...link} />
                        ))}
                    </HStack> */}
                    <UserMenuButton />
                </HStack>
            </HStack>
        </VStack>
    )
}
