"use client"

import { HStack, VStack, IconButton, Image, Button, Text, Box } from "@chakra-ui/react"
import { useRouter } from "next/navigation"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faDiscord, faGithub, faTelegram, faXTwitter, IconDefinition } from "@fortawesome/free-brands-svg-icons"
import { faBook, faGlobe } from "@fortawesome/free-solid-svg-icons"

import { ColorModeToggle } from "../color-mode/ColorModeToggle"

import Link from "next/link"

// const socialLinks = [{ href: "https://x.com/airdrip_club", label: "AirDrip X", icon: faXTwitter }]

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
        <HStack
            w="100%"
            maxW="1800px"
            h={"fit-content"}
            pt={4}
            pb={2}
            justifyContent={"space-between"}
            alignItems={"start"}
            px={3}
            zIndex={2}
        >
            <Box onClick={() => router.push("/")} cursor="pointer">
                <HStack gap={2}>
                    <Text mt={"-5px"} fontSize={"3xl"}>
                        <Image src="/static/logo/logo-coin.png" alt="Logo" boxSize={"40px"} borderRadius="full" />
                    </Text>
                    <Text minW="80px" fontWeight="bold" fontSize="xl" whiteSpace={"nowrap"} mt={"-6px"}>
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
            </HStack>
        </HStack>
    )
}
