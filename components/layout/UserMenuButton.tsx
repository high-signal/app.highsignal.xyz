"use client"

import { HStack, Box, Image, Text, Menu, Portal, Spinner } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faGear, faSignOut, faBars, faScrewdriverWrench } from "@fortawesome/free-solid-svg-icons"
import { faCircleUser } from "@fortawesome/free-regular-svg-icons"
import { usePrivy } from "@privy-io/react-auth"
import { useUser } from "../../contexts/UserContext"
import { ASSETS } from "../../config/constants"

// Common styles for the user button container
const userButtonStyles = {
    border: "2px solid",
    borderColor: "gray.800",
    borderRadius: "full",
    overflow: "hidden",
    justifyContent: "center",
    h: "50px",
    _hover: {
        borderColor: "gray.600",
    },
}

interface MenuItemProps {
    isHeading?: boolean
    icon?: any
    label: string
    value: string
    onClick?: () => void
    disabled?: boolean
    borderBottom?: boolean
    textColor?: string
}

const MenuItem = ({
    isHeading = false,
    icon,
    label,
    value,
    onClick,
    disabled,
    textColor = undefined,
}: MenuItemProps) => (
    <Menu.Item
        px={4}
        pt={3}
        pb={isHeading ? 2 : 3}
        cursor={disabled ? "default" : "pointer"}
        fontSize={"md"}
        value={value}
        onClick={onClick}
        disabled={disabled}
        opacity={disabled ? 0.8 : 1}
        fontWeight={disabled ? "bold" : "normal"}
        color={textColor}
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
                        <Box w="20px">
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
            <HStack {...userButtonStyles} w={"50px"}>
                <Spinner />
            </HStack>
        )
    }

    if (privyReady && authenticated && loggedInUser) {
        return (
            <Menu.Root onOpenChange={(details) => setIsMenuOpen(details.open)}>
                <Menu.Trigger asChild>
                    <HStack
                        {...userButtonStyles}
                        cursor="pointer"
                        maxW="120px"
                        border={"none"}
                        bg={"contentBackground"}
                        transform={{ base: "scale(1)", sm: isMenuOpen ? "scale(1.1)" : "scale(1)" }}
                        transition="transform 0.2s ease-in-out"
                        _hover={{
                            transform: { base: "scale(1)", sm: "scale(1.1)" },
                        }}
                    >
                        <Box maxW="50px" borderRadius="full" overflow="hidden">
                            <Image
                                src={
                                    !loggedInUser.profileImageUrl || loggedInUser.profileImageUrl === ""
                                        ? ASSETS.DEFAULT_PROFILE_IMAGE
                                        : loggedInUser.profileImageUrl
                                }
                                alt={`User ${loggedInUser.displayName} Profile Image`}
                                fit="cover"
                                transition="transform 0.2s ease-in-out"
                            />
                        </Box>
                        <Box pr={3}>
                            <FontAwesomeIcon icon={faBars} />
                        </Box>
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
                            {loggedInUser.isSuperAdmin && (
                                <>
                                    <MenuItem
                                        label="Super Admin"
                                        value="superAdmin"
                                        disabled
                                        isHeading
                                        textColor="orange.500"
                                    />
                                    <MenuItem
                                        key={"superAdminSettings"}
                                        icon={faScrewdriverWrench}
                                        label={"Settings"}
                                        value={"superAdminSettings"}
                                        onClick={() => router.push(`/settings/superadmin`)}
                                        textColor="orange.500"
                                    />
                                    <Box h="20px" w="100%" />
                                </>
                            )}
                            {loggedInUser.projectAdmins && loggedInUser.projectAdmins.length > 0 && (
                                <>
                                    <MenuItem label="Project Admin" value="projects" disabled isHeading />
                                    {loggedInUser.projectAdmins.map((project) => (
                                        <MenuItem
                                            key={project.projectId}
                                            icon={project.projectLogoUrl}
                                            label={project.projectName}
                                            value={`project-${project.projectId}`}
                                            onClick={() => router.push(`/settings/p/${project.urlSlug}`)}
                                        />
                                    ))}
                                    <Box h="20px" w="100%" />
                                </>
                            )}
                            <MenuItem label={loggedInUser.displayName} value="username" disabled isHeading />
                            <MenuItem
                                icon={faCircleUser}
                                label="Profile"
                                value="profile"
                                onClick={() => router.push(`/p/lido/${loggedInUser.username}`)}
                            />
                            <MenuItem
                                icon={faGear}
                                label="Settings"
                                value="settings"
                                onClick={() => router.push(`/settings/u/${loggedInUser.username}`)}
                            />
                            <MenuItem icon={faSignOut} label="Logout" value="logout" onClick={handleLogout} />
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
