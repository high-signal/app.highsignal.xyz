"use client"

import { HStack, Image, Text, Box, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXTwitter, IconDefinition } from "@fortawesome/free-brands-svg-icons"

import { ColorModeToggle } from "../color-mode/ColorModeToggle"
import UserMenuButton from "./UserMenuButton"

import Link from "next/link"
import { ASSETS, SOCIAL_LINKS } from "../../config/constants"

const iconMap = {
    faXTwitter,
}

const socialLinks = Object.values(SOCIAL_LINKS).map((link) => ({
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

export default function Header({}) {
    const router = useRouter()

    return (
        <VStack gap={0} w="100%" justifyContent={"center"} alignItems={"center"} zIndex={2}>
            {process.env.NODE_ENV === "development" && (
                <HStack w="100%" justifyContent={"center"} alignItems={"center"} bg={"orange.700"}>
                    <Text>Dev Environment</Text>
                </HStack>
            )}
            <HStack
                w="100%"
                maxW="1400px"
                h={"60px"}
                pt={4}
                pb={2}
                justifyContent={"space-between"}
                alignItems={"center"}
                px={3}
                gap={0}
            >
                <HStack gap={{ base: 2, sm: 10 }} flexGrow={1}>
                    <Box onClick={() => router.push("/")} cursor="pointer">
                        <HStack gap={2} justifyContent={"center"} alignItems={"center"}>
                            <Image src={ASSETS.LOGO} alt="Logo" boxSize={"50px"} borderRadius="full" />
                            <Text
                                minW="80px"
                                fontWeight="bold"
                                fontSize="xl"
                                whiteSpace={"nowrap"}
                                display={{ base: "none", sm: "block" }}
                            >
                                {process.env.NEXT_PUBLIC_SITE_NAME}
                            </Text>
                        </HStack>
                    </Box>
                    <HStack flexGrow={{ base: 1, sm: 0 }} justifyContent={"center"}>
                        <HStack
                            gap={5}
                            px={4}
                            py={1}
                            w="fit-content"
                            bg="gray.800"
                            borderRadius="full"
                            cursor="pointer"
                            _hover={{
                                bg: "gray.700",
                                _active: { bg: "gray.600" },
                            }}
                            _active={{ bg: "gray.600" }}
                            transition="all 0.1s ease"
                            onClick={() => {
                                router.push(`/p/lido/`)
                            }}
                            alignItems="center"
                            fontSize="lg"
                        >
                            <Text>View leaderboard</Text>
                        </HStack>
                    </HStack>
                </HStack>
                <HStack gap={{ base: 2, md: 6 }} alignItems={"top"}>
                    {/* <HStack direction="row" wrap="wrap" gap={2} justifyContent="right" pr={{ base: 0, md: 2 }}>
                        {socialLinks.map((link, index) => (
                            <IconLinkButton key={index} {...link} />
                        ))}
                    </HStack> */}
                    {/* <ColorModeToggle /> */}
                    <UserMenuButton />
                </HStack>
            </HStack>
        </VStack>
    )
}
