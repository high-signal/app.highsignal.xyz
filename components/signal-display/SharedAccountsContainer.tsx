"use client"

import { useState, useEffect } from "react"
import { VStack, Text, HStack, Box, Button, Spinner, Flex } from "@chakra-ui/react"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronRight, faExclamationTriangle, faInfoCircle } from "@fortawesome/free-solid-svg-icons"

import Divider from "../ui/Divider"

import { useUser } from "../../contexts/UserContext"
import { getAccessToken } from "@privy-io/react-auth"
import { useParams } from "next/navigation"
import { useRouter } from "next/navigation"

export default function SharedAccountsContainer({ projectData }: { projectData: ProjectData }) {
    const [isOpen, setIsOpen] = useState(false)
    const [totalVisibleAccounts, setTotalVisibleAccounts] = useState(0)
    const [targetUser, setTargetUser] = useState<UserData | null>(null)
    const [isPrivyAccountsLoading, setIsPrivyAccountsLoading] = useState(true)
    const [isUserAddressesLoading, setIsUserAddressesLoading] = useState(true)

    const router = useRouter()
    const { loggedInUser } = useUser()

    const params = useParams()
    const targetUsername = params.username as string

    const accountTypeMapping = {
        email: "Email",
        discord_username: "Discord",
        x_username: "X",
        farcaster_username: "Farcaster",
    }

    // Lookup all user_accounts for the target user
    const [publicAndSharedUserAccounts, setPublicAndSharedUserAccounts] = useState<UserPublicOrSharedAccount[]>([])
    useEffect(() => {
        const fetchPublicAndSharedUserAccounts = async () => {
            const token = await getAccessToken()
            const publicAndSharedUserAccountsResponse = await fetch(
                `/api/settings/u/accounts/privy-accounts?username=${targetUsername}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            )
            const publicAndSharedUserAccounts = await publicAndSharedUserAccountsResponse.json()

            // Filter out objects where isPublic is false but none of the userAccountsShared contains the projectData.urlSlug
            const filteredPublicAndSharedUserAccounts = publicAndSharedUserAccounts.filter(
                (account: UserPublicOrSharedAccount) => {
                    if (account.isPublic) {
                        return true
                    }
                    return account.userAccountsShared?.some(
                        (shared) => shared.project.projectUrlSlug === projectData.urlSlug,
                    )
                },
            )

            const alphabeticallySortedPublicAndSharedUserAccounts = filteredPublicAndSharedUserAccounts.sort(
                (a: UserPublicOrSharedAccount, b: UserPublicOrSharedAccount) => {
                    return a.type.localeCompare(b.type)
                },
            )

            setPublicAndSharedUserAccounts(alphabeticallySortedPublicAndSharedUserAccounts)
            setIsPrivyAccountsLoading(false)
        }
        fetchPublicAndSharedUserAccounts()
    }, [targetUsername, loggedInUser, projectData.urlSlug])

    // Get user data for wallet accounts
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = await getAccessToken()
                const response = await fetch(`/api/settings/u?username=${targetUsername}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    console.error("Failed to fetch user data:", errorData)
                    throw new Error(errorData.error || "Failed to fetch user data")
                }

                const data = await response.json()

                // Filter out the userAddresses that are not shared with the project and not public
                const filteredUserAddresses = data.userAddresses.filter((userAddress: UserAddressConfig) => {
                    return (
                        userAddress.projectsSharedWith.some(
                            (project) => project.projectUrlSlug === projectData.urlSlug,
                        ) || userAddress.isPublic
                    )
                })

                data.userAddresses = filteredUserAddresses

                setTargetUser(data)
                setIsUserAddressesLoading(false)
            } catch (err) {
                console.error("Error in fetchUserData:", err)
            }
        }

        fetchUserData()
    }, [router, projectData.urlSlug, targetUsername])

    // Calculate the total number of accounts that the user has shared with the project
    useEffect(() => {
        const totalPrivyAccountsVisible = publicAndSharedUserAccounts.reduce((count, entry) => {
            const hasShared = entry.userAccountsShared && entry.userAccountsShared.length > 0
            return count + (entry.isPublic || hasShared ? 1 : 0)
        }, 0)

        const totalUserAddressesVisible = targetUser?.userAddresses?.reduce((count, entry) => {
            const hasShared = entry.projectsSharedWith.some((project) => project.projectUrlSlug === projectData.urlSlug)
            return count + (entry.isPublic || hasShared ? 1 : 0)
        }, 0)

        const totalAccounts = totalPrivyAccountsVisible + (totalUserAddressesVisible || 0)

        setTotalVisibleAccounts(totalAccounts)
    }, [publicAndSharedUserAccounts, targetUser, projectData.urlSlug])

    return (
        <VStack gap={0} w="100%" maxW="600px" alignItems={"center"} bg={"pageBackground"}>
            <HStack
                onClick={() => setIsOpen(!isOpen)}
                w={{ base: "100%", md: "auto" }}
                bg={"pageBackground"}
                borderTop="3px solid"
                borderBottom={isOpen ? "0px" : "3px solid"}
                borderX="3px solid"
                borderColor="contentBorder"
                borderTopRadius={"16px"}
                borderBottomRadius={isOpen ? "0px" : "16px"}
                justifyContent={"center"}
                alignItems={"start"}
                pl={3}
                pr={2}
                py={"4px"}
                cursor="pointer"
                zIndex={10}
            >
                <Box transform={isOpen ? "rotate(90deg)" : "rotate(0deg)"} transition="transform 0.2s">
                    <FontAwesomeIcon icon={faChevronRight} />
                </Box>
                <Text textAlign={"center"} px={{ base: 3, md: 1 }}>
                    Account details {projectData.displayName} can see for {loggedInUser?.displayName}
                </Text>
                <Box bg={"contentBackground"} borderRadius="full" px={2} py={0} fontWeight={"bold"} fontSize={"16px"}>
                    {isPrivyAccountsLoading || isUserAddressesLoading ? (
                        <Spinner size="xs" mx={"-1px"} />
                    ) : (
                        <Text>{totalVisibleAccounts}</Text>
                    )}
                </Box>
            </HStack>
            {isOpen && (
                <VStack
                    alignItems={"start"}
                    gap={4}
                    w={"100%"}
                    bg={"pageBackground"}
                    border="3px solid"
                    borderColor="contentBorder"
                    borderBottomRadius={"16px"}
                    borderTopRadius={{ base: "0px", md: "16px" }}
                    mx={{ base: 0, md: 10 }}
                    pt={4}
                    pb={3}
                    mt={"-3px"}
                >
                    <HStack w="100%" justifyContent={"center"}>
                        <HStack
                            justifyContent={"center"}
                            gap={2}
                            px={2}
                            bg={"contentBackground"}
                            borderRadius="full"
                            py={0}
                            mx={3}
                            cursor="default"
                        >
                            <FontAwesomeIcon icon={faInfoCircle} />
                            <Text>Only you can see this information</Text>
                        </HStack>
                    </HStack>
                    <Text color="textColorMuted" px={{ base: 3, md: 6 }}>
                        Listed below are all of your account details that {projectData.displayName} can see.
                    </Text>
                    <Text color="textColorMuted" px={{ base: 3, md: 6 }}>
                        While your Signal Score values are public, the usernames and addresses of the accounts behind
                        them are private by default to protect your privacy.
                    </Text>
                    <Text color="textColorMuted" px={{ base: 3, md: 6 }}>
                        For example, everyone can see you Signal Score for Discord (if you have connected your Discord
                        account), but they cannot see your Discord username unless you choose to share it.
                    </Text>
                    <Text color="textColorMuted" px={{ base: 3, md: 6 }}>
                        {projectData.displayName} can use this information to associate your High Signal score with you.
                        For example, if you share an Ethereum address with {projectData.displayName}, they will know
                        that your High Signal Score is linked to that address.
                    </Text>
                    <Text color="textColorMuted" px={{ base: 3, md: 6 }}>
                        If you have not shared any account details with {projectData.displayName} and do not have any
                        public accounts, then {projectData.displayName} cannot associate your score with you.
                    </Text>
                    <HStack w="100%" justifyContent={"center"} px={3}>
                        <Button
                            primaryButton
                            px={2}
                            py={1}
                            borderRadius={"full"}
                            onClick={() => {
                                router.push(`/settings/u/${loggedInUser?.username}?tab=accounts`)
                            }}
                            whiteSpace="normal"
                            textAlign="center"
                        >
                            <Text whiteSpace="normal">Manage your account sharing settings</Text>
                        </Button>
                    </HStack>
                    <Divider borderWidth={3} />
                    {(isPrivyAccountsLoading || isUserAddressesLoading) && (
                        <HStack w="100%" justifyContent={"center"}>
                            <Spinner />
                            <Text>Loading accounts...</Text>
                        </HStack>
                    )}
                    {!(isPrivyAccountsLoading || isUserAddressesLoading) && totalVisibleAccounts > 0 && (
                        <VStack w="100%" alignItems="start" px={3} gap={{ base: 6, md: 4 }}>
                            {targetUser &&
                                targetUser.userAddresses
                                    ?.sort((a, b) => a.address.localeCompare(b.address))
                                    .map((userAddressConfig, index) => {
                                        return (
                                            <Flex
                                                direction={{ base: "column", md: "row" }}
                                                key={index}
                                                gap={{ base: 1, md: 3 }}
                                                alignItems={"start"}
                                                cursor={"default"}
                                                w="100%"
                                            >
                                                <HStack gap={3}>
                                                    <Text>✅</Text>
                                                    <Text fontWeight="bold">Address:</Text>
                                                </HStack>
                                                <Flex
                                                    direction={{ base: "column", md: "row" }}
                                                    wrap="wrap"
                                                    justifyContent={"space-between"}
                                                    w={{ base: "auto", md: "100%" }}
                                                    gap={{ base: 1, md: 3 }}
                                                >
                                                    <HStack wrap="wrap">
                                                        {userAddressConfig.addressName && (
                                                            <Text
                                                                bg={"contentBackground"}
                                                                borderRadius="full"
                                                                px={2}
                                                                py={0}
                                                            >
                                                                {userAddressConfig.addressName}
                                                            </Text>
                                                        )}
                                                        <Text fontFamily="monospace" fontSize="md">
                                                            {`${userAddressConfig.address.slice(0, 6)}...${userAddressConfig.address.slice(-4)}`}
                                                        </Text>
                                                    </HStack>
                                                    <Text
                                                        bg={"contentBackground"}
                                                        borderRadius="full"
                                                        px={2}
                                                        py={0}
                                                        w={"fit-content"}
                                                    >
                                                        {userAddressConfig.isPublic
                                                            ? "Public"
                                                            : "Shared  with " + projectData.displayName}
                                                    </Text>
                                                </Flex>
                                            </Flex>
                                        )
                                    })}
                            {publicAndSharedUserAccounts.map((account) => (
                                <Flex
                                    direction={{ base: "column", md: "row" }}
                                    key={account.type}
                                    gap={{ base: 1, md: 3 }}
                                    cursor={"default"}
                                    justifyContent={"space-between"}
                                    w={{ base: "auto", md: "100%" }}
                                >
                                    <HStack gap={3}>
                                        <Text>✅</Text>
                                        <Text fontWeight={"bold"}>
                                            {accountTypeMapping[account.type as keyof typeof accountTypeMapping]}{" "}
                                            {account.type === "email" ? "address" : "username"}
                                        </Text>
                                    </HStack>
                                    <Text bg={"contentBackground"} borderRadius="full" px={2} py={0} w={"fit-content"}>
                                        {account.isPublic ? "Public" : "Shared  with " + projectData.displayName}
                                    </Text>
                                </Flex>
                            ))}
                        </VStack>
                    )}
                    {!(isPrivyAccountsLoading || isUserAddressesLoading) && totalVisibleAccounts === 0 && (
                        <VStack w="100%" color={"orange.500"} px={3} textAlign={"center"}>
                            <HStack w="100%" justifyContent={"center"} alignItems={"center"} fontWeight={"bold"}>
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                <Text pt={"2px"}>No accounts visible to {projectData.displayName}</Text>
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                            </HStack>
                            <Text>
                                You have not shared any accounts with {projectData.displayName} and do not have any
                                accounts set to public. This means {projectData.displayName} cannot associate your High
                                Signal score with you.
                            </Text>
                        </VStack>
                    )}
                </VStack>
            )}
        </VStack>
    )
}
