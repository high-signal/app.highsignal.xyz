"use client"

import { HStack, Box, Image, Text, Menu, Portal, Spinner, Button } from "@chakra-ui/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faGear, faSignOut, faBars, faScrewdriverWrench } from "@fortawesome/free-solid-svg-icons"
import { getAccessToken, usePrivy } from "@privy-io/react-auth"
import { useUser } from "../../contexts/UserContext"
import { ASSETS } from "../../config/constants"

// Common styles for the user button container
const userButtonStyles = {
    borderRadius: "full",
    overflow: "hidden",
    justifyContent: "center",
    h: "50px",
}

interface MenuItemProps {
    isHeading?: boolean
    icon?: any
    label: string
    value: string
    onClick?: () => void
    borderBottom?: boolean
    textColor?: string
}

const MenuItem = ({ isHeading = false, icon, label, value, onClick, textColor = undefined }: MenuItemProps) => (
    <Menu.Item
        px={4}
        pt={3}
        pb={isHeading ? 2 : 3}
        cursor={isHeading ? "default" : "pointer"}
        transition={"all 0.2s ease"}
        _active={{ bg: "button.secondary.active" }}
        _highlighted={{ bg: "button.secondary.hover" }}
        fontSize={"md"}
        value={value}
        onClick={onClick}
        disabled={isHeading}
        opacity={isHeading ? 0.8 : 1}
        fontWeight={isHeading ? "bold" : "normal"}
        color={textColor}
        borderRadius={0}
    >
        <HStack>
            {icon ? (
                <>
                    {typeof icon === "string" && icon.startsWith("http") ? (
                        <Box w="20px" mr={2}>
                            <Image
                                src={icon}
                                alt={label}
                                boxSize="20px"
                                objectFit="cover"
                                borderRadius="full"
                                transform="scale(1.5)"
                            />
                        </Box>
                    ) : (
                        <Box w="20px" ml={1} mr={1}>
                            <FontAwesomeIcon icon={icon} />
                        </Box>
                    )}

                    <Text>{label}</Text>
                </>
            ) : (
                <Text>{label}</Text>
            )}
        </HStack>
    </Menu.Item>
)

export default function UserMenuButton() {
    const router = useRouter()
    const { login, authenticated, logout, ready: privyReady } = usePrivy()
    const { loggedInUser, loggedInUserLoading, userCreated, setUserCreated } = useUser()
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

    if (loggedInUserLoading) {
        return (
            <Button secondaryButton {...userButtonStyles} disabled opacity={1} w={"50px"}>
                <Spinner />
            </Button>
        )
    }

    if (privyReady && authenticated && loggedInUser) {
        return (
            <Menu.Root onOpenChange={(details) => setIsMenuOpen(details.open)}>
                <Menu.Trigger asChild>
                    <Button secondaryButton {...userButtonStyles} maxW="120px" border={"none"} zIndex={3}>
                        <Box maxW="50px" borderRadius="full" overflow="hidden">
                            <Image
                                src={
                                    !loggedInUser.profileImageUrl || loggedInUser.profileImageUrl === ""
                                        ? ASSETS.DEFAULT_PROFILE_IMAGE
                                        : loggedInUser.profileImageUrl
                                }
                                alt={`User ${loggedInUser.displayName} Profile Image`}
                                fit="cover"
                                minW="50px"
                                transition="transform 0.2s ease-in-out"
                            />
                        </Box>
                        <Box pr={3}>
                            <FontAwesomeIcon icon={faBars} size="lg" />
                        </Box>
                    </Button>
                </Menu.Trigger>
                {isMenuOpen && (
                    <Box
                        position="fixed"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                        bg="rgba(0, 0, 0, 0.5)"
                        backdropFilter="blur(3px)"
                        zIndex={2}
                    />
                )}
                <Portal>
                    <Menu.Positioner>
                        <Menu.Content borderRadius={"16px"} p={0} bg={"pageBackground"}>
                            {loggedInUser.isSuperAdmin && (
                                <>
                                    <MenuItem isHeading label="Super Admin" value="superAdmin" textColor="orange.500" />
                                    <Link href={`/settings/superadmin`}>
                                        <MenuItem
                                            key={"superAdminSettings"}
                                            icon={faScrewdriverWrench}
                                            label={"Settings"}
                                            value={"superAdminSettings"}
                                            textColor="orange.500"
                                        />
                                    </Link>
                                    <Box h="10px" w="100%" />
                                </>
                            )}
                            {loggedInUser.projectAdmins && loggedInUser.projectAdmins.length > 0 && (
                                <>
                                    <MenuItem isHeading label="Project Admin" value="projects" />
                                    {loggedInUser.projectAdmins.map((project) => (
                                        <Link key={project.projectId} href={`/settings/p/${project.urlSlug}`}>
                                            <MenuItem
                                                icon={project.projectLogoUrl}
                                                label={project.projectName}
                                                value={`project-${project.projectId}`}
                                            />
                                        </Link>
                                    ))}
                                    <Box h="10px" w="100%" />
                                </>
                            )}
                            <MenuItem isHeading label={loggedInUser.displayName} value="username" />
                            <Link href={`/u/${loggedInUser.username}`}>
                                <MenuItem
                                    icon={loggedInUser.profileImageUrl || ASSETS.DEFAULT_PROFILE_IMAGE}
                                    label="My scores"
                                    value="profile"
                                />
                            </Link>
                            <Link href={`/settings/u/${loggedInUser.username}`}>
                                <MenuItem icon={faGear} label="My settings" value="settings" />
                            </Link>
                            <MenuItem icon={faSignOut} label="Logout" value="logout" onClick={handleLogout} />
                        </Menu.Content>
                    </Menu.Positioner>
                </Portal>
            </Menu.Root>
        )
    }

    return (
        <Button
            primaryButton
            {...userButtonStyles}
            w="fit-content"
            px={4}
            h="35px"
            onClick={() => {
                login()
            }}
        >
            <Text fontWeight={"bold"}>Log in or create an account</Text>
        </Button>
    )
}
