"use client"

import { HStack, Box, Image, Text, Menu, Portal, Spinner } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faGear, faSignOut } from "@fortawesome/free-solid-svg-icons"
import { faCircleUser } from "@fortawesome/free-regular-svg-icons"
import { usePrivy } from "@privy-io/react-auth"
import { useUser } from "../../contexts/UserContext"

// Common styles for the user button container
const userButtonStyles = {
    border: "2px solid",
    borderColor: "gray.800",
    borderRadius: "full",
    overflow: "hidden",
    justifyContent: "center",
    h: "50px",
    _hover: {
        borderColor: "gray.500",
    },
}

export default function UserMenuButton() {
    const router = useRouter()
    const { login, authenticated, logout, ready: privyReady } = usePrivy()
    const { user, isLoading, userCreated, setUserCreated } = useUser()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    // On user creation, redirect to the user settings page
    useEffect(() => {
        if (userCreated) {
            setUserCreated("")
            router.push(`/settings/u/${userCreated}`)
        }
    }, [userCreated, setUserCreated, router])

    const handleLogout = () => {
        logout()
        router.push("/")
    }

    if (isLoading) {
        return (
            <HStack {...userButtonStyles} w={"50px"}>
                <Spinner />
            </HStack>
        )
    }

    if (privyReady && authenticated && user) {
        return (
            <Menu.Root onOpenChange={(details) => setIsMenuOpen(details.open)}>
                <Menu.Trigger asChild>
                    <HStack
                        {...userButtonStyles}
                        cursor="pointer"
                        maxW="50px"
                        border={"none"}
                        transform={{ base: "scale(1)", sm: isMenuOpen ? "scale(1.1)" : "scale(1)" }}
                        transition="transform 0.2s ease-in-out"
                        _hover={{
                            transform: { base: "scale(1)", sm: "scale(1.1)" },
                        }}
                    >
                        <Image
                            src={
                                !user.profileImageUrl || user.profileImageUrl === ""
                                    ? "/static/default-profile-image.png"
                                    : user.profileImageUrl
                            }
                            alt={`User ${user.displayName} Profile Image`}
                            fit="cover"
                            transition="transform 0.2s ease-in-out"
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
                                {user.displayName}
                            </Menu.Item>
                            <Menu.Item
                                py={3}
                                pl={4}
                                cursor={"pointer"}
                                fontSize={"md"}
                                value="profile"
                                // TODO: Uncomment this when the profile page is implemented
                                // onClick={() => router.push(`/u/${user.username}`)}
                                onClick={() => router.push(`/p/lido/${user.username}`)}
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
                                onClick={() => router.push(`/settings/u/${user.username}`)}
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
        )
    }

    return (
        <HStack {...userButtonStyles} cursor="pointer" w="80px" h="40px" onClick={login}>
            <Text fontWeight={"bold"}>Log in</Text>
        </HStack>
    )
}
