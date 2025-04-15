"use client"

import { HStack, VStack, IconButton, Image, Button, Text, Box, Avatar, Menu } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faDiscord, faGithub, faTelegram, faXTwitter, IconDefinition } from "@fortawesome/free-brands-svg-icons"
import { faBook, faGlobe } from "@fortawesome/free-solid-svg-icons"

import { ColorModeToggle } from "../color-mode/ColorModeToggle"
import { usePrivy } from "@privy-io/react-auth"
import { useUser } from "../../contexts/UserContext"
import SignUpDialog from "../auth/SignUpDialog"

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
    const { login, authenticated, logout, ready } = usePrivy()
    const { user, isLoading } = useUser()
    const [isSignUpDialogOpen, setIsSignUpDialogOpen] = useState(false)

    const handleLogin = () => {
        login()
    }

    const handleLogout = () => {
        logout()
    }

    const handleSignUp = () => {
        if (authenticated && !user) {
            setIsSignUpDialogOpen(true)
        } else {
            login()
        }
    }

    return (
        <>
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

                    {ready && (
                        <>
                            {authenticated && user ? (
                                <Menu.Root>
                                    <Menu.Trigger asChild>
                                        <Button variant="outline" size="sm">
                                            <HStack>
                                                {/* <Avatar.Root>
                                                    <Avatar.Image src="" alt={user.display_name} />
                                                    <Avatar.Fallback>{user.display_name.charAt(0)}</Avatar.Fallback>
                                                </Avatar.Root> */}
                                                <Text>{user.display_name}</Text>
                                            </HStack>
                                        </Button>
                                    </Menu.Trigger>
                                    <Menu.Content>
                                        <Menu.Item
                                            value="profile"
                                            onClick={() => router.push(`/profile/${user.username}`)}
                                        >
                                            Profile
                                        </Menu.Item>
                                        <Menu.Item value="logout" onClick={handleLogout}>
                                            Logout
                                        </Menu.Item>
                                    </Menu.Content>
                                </Menu.Root>
                            ) : (
                                <Button variant="outline" size="sm" onClick={handleSignUp} loading={isLoading}>
                                    {authenticated ? "Complete Profile" : "Sign Up"}
                                </Button>
                            )}
                        </>
                    )}
                </HStack>
            </HStack>

            <SignUpDialog isOpen={isSignUpDialogOpen} onClose={() => setIsSignUpDialogOpen(false)} />
        </>
    )
}
