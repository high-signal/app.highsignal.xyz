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
            >
                <Box onClick={() => router.push("/")} cursor="pointer">
                    <HStack gap={2} justifyContent={"center"} alignItems={"center"}>
                        <Image src={ASSETS.LOGO} alt="Logo" boxSize={"40px"} borderRadius="full" />
                        <Text minW="80px" fontWeight="bold" fontSize="xl" whiteSpace={"nowrap"}>
                            {process.env.NEXT_PUBLIC_SITE_NAME}
                        </Text>
                    </HStack>
                </Box>
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
