"use client"

import { HStack, VStack, IconButton, Image, Button, Text, Box, Avatar, Menu, Portal, Spinner } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXTwitter, IconDefinition } from "@fortawesome/free-brands-svg-icons"
import { faGear, faSignOut } from "@fortawesome/free-solid-svg-icons"
import { faCircleUser } from "@fortawesome/free-regular-svg-icons"

import { ColorModeToggle } from "../color-mode/ColorModeToggle"
import { usePrivy } from "@privy-io/react-auth"
import { useUser } from "../../contexts/UserContext"

import Link from "next/link"

// const socialLinks = [{ href: "https://x.com/highsignalxyz", label: "High Signal X", icon: faXTwitter }]

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
    const { login, authenticated, logout, ready: privyReady, getAccessToken } = usePrivy()
    const { user, isLoading, userCreated } = useUser()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const handleLogout = () => {
        logout()
    }

    // On user creation, redirect to the user settings page
    useEffect(() => {
        if (userCreated) {
            router.push(`/settings/u/${userCreated}`)
        }
    }, [userCreated])

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

                {isLoading ? (
                    <HStack
                        border={"2px solid"}
                        borderColor={"gray.800"}
                        boxSize="40px"
                        borderRadius="full"
                        overflow="hidden"
                        mt={"-6px"}
                        justifyContent={"center"}
                    >
                        <Spinner />
                    </HStack>
                ) : privyReady && authenticated && user ? (
                    <Menu.Root onOpenChange={(details) => setIsMenuOpen(details.open)}>
                        <Menu.Trigger asChild>
                            <HStack
                                border={"2px solid"}
                                borderColor={"gray.800"}
                                cursor={"pointer"}
                                boxSize="40px"
                                borderRadius="full"
                                overflow="hidden"
                                mt={"-6px"}
                            >
                                <Image
                                    src={
                                        !user.profile_image_url || user.profile_image_url === ""
                                            ? "/static/default-profile-image.png"
                                            : user.profile_image_url
                                    }
                                    alt={`User ${user.display_name} Profile Image`}
                                    fit="cover"
                                />
                            </HStack>
                        </Menu.Trigger>
                        <Portal>
                            {isMenuOpen && (
                                <Box
                                    position="fixed"
                                    top={0}
                                    left={0}
                                    right={0}
                                    bottom={0}
                                    bg="rgba(0, 0, 0, 0.4)"
                                    backdropFilter="blur(4px)"
                                    zIndex={1}
                                />
                            )}
                            <Menu.Positioner>
                                <Menu.Content borderRadius={"16px"} p={0}>
                                    <Menu.Item
                                        py={3}
                                        pl={4}
                                        value="username"
                                        disabled
                                        opacity={0.8}
                                        fontWeight="bold"
                                        cursor="default"
                                        borderBottom={"1px solid"}
                                        borderRadius={"0px"}
                                        fontSize={"md"}
                                    >
                                        {user.display_name}
                                    </Menu.Item>
                                    <Menu.Item
                                        py={3}
                                        pl={4}
                                        cursor={"pointer"}
                                        fontSize={"md"}
                                        value="profile"
                                        onClick={() => router.push(`/u/${user.username}`)}
                                    >
                                        <HStack>
                                            <Box w="20px">
                                                <FontAwesomeIcon icon={faCircleUser} />
                                            </Box>
                                            <Text>Profile</Text>
                                        </HStack>
                                    </Menu.Item>
                                    <Menu.Item
                                        pl={4}
                                        py={3}
                                        cursor={"pointer"}
                                        fontSize={"md"}
                                        value="settings"
                                        onClick={() => router.push(`/u/${user.username}/settings`)}
                                    >
                                        <HStack>
                                            <Box w="20px">
                                                <FontAwesomeIcon icon={faGear} />
                                            </Box>
                                            <Text>Settings</Text>
                                        </HStack>
                                    </Menu.Item>
                                    <Menu.Item
                                        pl={4}
                                        py={3}
                                        cursor={"pointer"}
                                        fontSize={"md"}
                                        value="logout"
                                        onClick={handleLogout}
                                    >
                                        <HStack>
                                            <Box w="20px">
                                                <FontAwesomeIcon icon={faSignOut} />
                                            </Box>
                                            <Text>Logout</Text>
                                        </HStack>
                                    </Menu.Item>
                                </Menu.Content>
                            </Menu.Positioner>
                        </Portal>
                    </Menu.Root>
                ) : (
                    <HStack
                        border={"2px solid"}
                        borderColor={"gray.800"}
                        cursor={"pointer"}
                        w="80px"
                        h="40px"
                        borderRadius="full"
                        overflow="hidden"
                        mt={"-6px"}
                        justifyContent={"center"}
                        fontWeight={"bold"}
                        onClick={login}
                    >
                        <Text>Log in</Text>
                    </HStack>
                )}
            </HStack>
        </HStack>
    )
}
