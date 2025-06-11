"use client"

import { HStack, VStack, Text, Button, Dialog, Spinner, Link } from "@chakra-ui/react"
import Modal from "../../ui/Modal"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCopy, faExternalLink, faMagnifyingGlass, faXmark, faRefresh } from "@fortawesome/free-solid-svg-icons"
import { useEffect, useState } from "react"
import { faCheckCircle } from "@fortawesome/free-regular-svg-icons"
import { usePrivy } from "@privy-io/react-auth"
import { useUser } from "../../../contexts/UserContext"
import { toaster } from "../../ui/toaster"
import { useRouter } from "next/navigation"

interface ConnectTypeSelectorModalProps {
    isOpen: boolean
    onClose: () => void
    config: {
        projectDisplayName: string
        projectUrlSlug: string
        projectLogoUrl: string | undefined
        forumUrl: string | undefined
        forumAuthTypes: string[] | undefined
        forumAuthParentPostUrl: string | undefined
    }
    targetUser: UserData
    isForumSubmitting: boolean
    handleForumAuthApi: () => void
}

export default function ConnectTypeSelectorModal({
    isOpen,
    onClose,
    config,
    targetUser,
    isForumSubmitting,
    handleForumAuthApi,
}: ConnectTypeSelectorModalProps) {
    const [isCodeCopied, setIsCodeCopied] = useState(false)
    const [isAuthPostCodeCheckSubmitted, setIsAuthPostCodeCheckSubmitted] = useState(false)
    const [authPostCheckError, setAuthPostCheckError] = useState<string | null>(null)

    const { refreshUser } = useUser()
    const { getAccessToken } = usePrivy()
    const router = useRouter()

    const [authPostCode, setAuthPostCode] = useState<string | undefined>(undefined)

    const signalStrengthName = "discourse_forum"

    const authEncryptedPayload =
        targetUser.forumUsers?.find((forumUser) => forumUser.projectUrlSlug === config.projectUrlSlug)
            ?.authEncryptedPayload || null
    const authPostId =
        targetUser.forumUsers?.find((forumUser) => forumUser.projectUrlSlug === config.projectUrlSlug)?.authPostId ||
        null

    // Update the authPostCode when the targetUser or projectUrlSlug changes
    useEffect(() => {
        setAuthPostCode(
            targetUser?.forumUsers?.find((forumUser) => forumUser.projectUrlSlug === config.projectUrlSlug)
                ?.authPostCode,
        )
    }, [targetUser, config.projectUrlSlug])

    const authPostMessage = `This post is proof to High Signal that I am the owner of this ${config.projectDisplayName} forum account. My authentication code is: ${authPostCode}`

    // When modal opens, if no authPostCode is found, generate one
    useEffect(() => {
        const fetchAuthPostCode = async () => {
            if (!authPostCode) {
                const token = await getAccessToken()
                const response = await fetch(
                    `/api/settings/u/accounts/forum_users/auth/manual_post?username=${targetUser.username}&project=${config.projectUrlSlug}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    },
                )

                if (!response.ok) {
                    throw new Error("Failed to generate auth post code")
                }

                const data = await response.json()
                setAuthPostCode(data.authPostCode)
            }
        }
        if (isOpen) {
            fetchAuthPostCode()
        }
    }, [isOpen, authPostCode, targetUser.username, config.projectUrlSlug, getAccessToken])

    const handleAuthPostCodeCheck = async () => {
        setIsAuthPostCodeCheckSubmitted(true)
        const token = await getAccessToken()
        const response = await fetch(
            `/api/settings/u/accounts/forum_users/auth/manual_post?username=${targetUser.username}&project=${config.projectUrlSlug}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            },
        )

        if (!response.ok) {
            setIsAuthPostCodeCheckSubmitted(false)
            setAuthPostCheckError("Authentication post code check failed. Please try again.")
            throw new Error("Authentication post code check failed")
        }

        const data = await response.json()
        if (data.authPostCodeFound) {
            // Show success message
            toaster.create({
                title: `✅ ${config.projectDisplayName} forum ownership confirmed`,
                description: `Your ${config.projectDisplayName} forum account ownership has been confirmed. View your ${config.projectDisplayName} signal score to see the calculation in progress.`,
                type: "success",
                action: {
                    label: `View your ${config.projectDisplayName} signal score`,
                    onClick: () =>
                        router.push(`/p/${config.projectUrlSlug}/${targetUser?.username}#${signalStrengthName}`),
                },
            })
            handleClose()
            setIsAuthPostCodeCheckSubmitted(false)
            refreshUser()
        } else {
            setIsAuthPostCodeCheckSubmitted(false)
            setAuthPostCheckError(
                "Your code was not found on forum post yet. It can take up to a minute to appear. Make sure you have posted the message on the forum and try again.",
            )
        }
    }

    const handleCopyCode = (text: string) => {
        navigator.clipboard.writeText(text)
        setIsCodeCopied(true)
        setTimeout(() => {
            setIsCodeCopied(false)
        }, 2000)
    }

    const TypeSelector = ({
        option,
        title,
        children,
    }: {
        option: string
        title: string
        children: React.ReactNode
    }) => {
        return (
            <VStack
                flex="1"
                bg={"contentBackground"}
                borderRadius={"16px"}
                p={4}
                mx={{ base: 0, md: 2 }}
                w={"100%"}
                minW={{ base: "100%", md: "400px" }}
                justifyContent={"start"}
                alignItems={"center"}
                h={"100%"}
                gap={3}
                border={"3px solid"}
                borderColor={"contentBorder"}
            >
                <VStack fontWeight={"bold"} fontSize={"md"} textAlign={"center"} gap={4}>
                    <Text color={"green.500"}>{option}</Text>
                    <Text fontSize={"lg"} pb={3}>
                        {title}
                    </Text>
                </VStack>
                <VStack gap={4} textAlign={"center"} maxW={"100%"}>
                    {children}
                </VStack>
            </VStack>
        )
    }

    const handleClose = () => {
        setAuthPostCheckError(null)
        onClose()
    }

    return (
        <Modal open={isOpen} close={handleClose} placement={{ base: "top", md: "top" }}>
            <Dialog.Content
                borderRadius={{ base: "0px", md: "16px" }}
                p={0}
                bg={"pageBackground"}
                maxW={"1200px"}
                mx={{ base: 0, md: "20px" }}
            >
                <Dialog.Header>
                    <Dialog.Title textAlign={"center"}>
                        <Text fontWeight="bold" px={4}>
                            Confirm ownership of your {config.projectDisplayName} forum account
                        </Text>
                        <Button
                            closeButton
                            position="absolute"
                            right={{ base: "10px", md: "28px" }}
                            top="28px"
                            onClick={handleClose}
                            borderRadius="full"
                            color={"pageBackground"}
                            w="20px"
                            h="20px"
                            minW="20px"
                            maxW="20px"
                            justifyContent={"center"}
                            alignItems={"center"}
                            display="flex"
                        >
                            <FontAwesomeIcon icon={faXmark} />
                        </Button>
                    </Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                    <HStack flexWrap={"wrap"} alignItems={"start"}>
                        <TypeSelector option="Option 1 (Recommended)" title="Automatic ownership check">
                            <Text>
                                Allows High Signal to automatically confirm you are the owner of your{" "}
                                {config.projectDisplayName} forum account.
                            </Text>
                            <Text>
                                Clicking the{" "}
                                <Text as="span" fontWeight={"bold"}>
                                    Confirm ownership
                                </Text>{" "}
                                button will redirect you to {config.projectDisplayName} forum where you will be asked to{" "}
                                <Text as="span" fontWeight={"bold"}>
                                    Authorize
                                </Text>{" "}
                                High Signal to{" "}
                                <Text as="span" fontWeight={"bold"}>
                                    Read user session info
                                </Text>
                                .
                            </Text>
                            <Text>
                                This will allow High Signal to confirm you are the owner of your{" "}
                                {config.projectDisplayName} forum account but does not allow any other actions.
                            </Text>
                            <Button
                                {...(config.forumAuthTypes?.includes("api_auth") && !authEncryptedPayload
                                    ? { primaryButton: true }
                                    : authEncryptedPayload
                                      ? { successButton: true }
                                      : { contentButton: true })}
                                border={"3px solid"}
                                borderColor={
                                    config.forumAuthTypes?.includes("api_auth") && authEncryptedPayload
                                        ? "lozenge.border.active"
                                        : "transparent"
                                }
                                minH={"40px"}
                                w={"100%"}
                                onClick={handleForumAuthApi}
                                borderRadius="full"
                                disabled={!config.forumAuthTypes?.includes("api_auth") || isForumSubmitting}
                                mt={2}
                                loading={isForumSubmitting}
                            >
                                {config.forumAuthTypes?.includes("api_auth") ? (
                                    <HStack>
                                        <Text fontWeight="bold" whiteSpace="normal" py={0} px={0}>
                                            {authEncryptedPayload
                                                ? "Ownership confirmed - Refresh connection"
                                                : "Confirm ownership"}
                                        </Text>
                                        {config.forumAuthTypes?.includes("api_auth") && authEncryptedPayload && (
                                            <FontAwesomeIcon icon={faRefresh} size="lg" />
                                        )}
                                    </HStack>
                                ) : (
                                    <Text fontWeight="bold" whiteSpace="normal" py={2} px={4}>
                                        This authentication method has not been enabled by {config.projectDisplayName}
                                    </Text>
                                )}
                            </Button>
                        </TypeSelector>
                        <TypeSelector option="Option 2" title="Post a public message">
                            <Text>
                                Allows High Signal to confirm you are the owner of your {config.projectDisplayName}{" "}
                                forum account by checking a public message on the {config.projectDisplayName} forum.
                            </Text>
                            <Text>Copy this message with your access code:</Text>
                            <VStack gap={2}>
                                <HStack bg={"pageBackground"} py={2} px={4} borderRadius={"16px"} fontWeight={"bold"}>
                                    <Text>{authPostCode ? authPostMessage : "Generating auth code..."}</Text>
                                    {authPostCode ? null : <Spinner size="sm" color="white" />}
                                </HStack>
                                <Button
                                    contentButton
                                    h={"100%"}
                                    pl={3}
                                    pr={2}
                                    py={1}
                                    borderRadius={"full"}
                                    onClick={() => handleCopyCode(authPostMessage)}
                                    disabled={!authPostCode}
                                >
                                    <HStack gap={2} justifyContent={"start"}>
                                        <Text>{isCodeCopied ? "Copied" : "Copy message"}</Text>
                                        <FontAwesomeIcon icon={isCodeCopied ? faCheckCircle : faCopy} size="lg" />
                                    </HStack>
                                </Button>
                            </VStack>
                            <Text>
                                Post the message on the {config.projectDisplayName} forum thread for High Signal
                                authentication:
                            </Text>
                            <Link href={config.forumAuthParentPostUrl} target="_blank" textDecoration={"none"}>
                                <Button contentButton px={3} py={1} borderRadius={"full"}>
                                    <HStack>
                                        <Text whiteSpace="normal">
                                            Go to the {config.projectDisplayName} forum High Signal authentication post
                                        </Text>
                                        <FontAwesomeIcon icon={faExternalLink} size="lg" />
                                    </HStack>
                                </Button>
                            </Link>

                            <Text>
                                Once you have posted the message, click the{" "}
                                <Text as="span" fontWeight={"bold"}>
                                    Check forum post
                                </Text>{" "}
                                button to confirm you are the owner of your {config.projectDisplayName} forum account.
                            </Text>
                            <Button
                                {...(!authPostId || authEncryptedPayload
                                    ? { primaryButton: true }
                                    : { successButton: true })}
                                border={"3px solid"}
                                borderColor={
                                    !authPostId || authEncryptedPayload ? "transparent" : "lozenge.border.active"
                                }
                                minH={"40px"}
                                w={"100%"}
                                onClick={handleAuthPostCodeCheck}
                                borderRadius="full"
                                disabled={isAuthPostCodeCheckSubmitted}
                                mt={2}
                                loading={isAuthPostCodeCheckSubmitted}
                            >
                                <HStack>
                                    <Text fontWeight="bold" whiteSpace="normal" py={0} px={0}>
                                        {!authPostId || authEncryptedPayload
                                            ? "Check the forum for my post"
                                            : "Ownership confirmed - Check the forum for my post again"}
                                    </Text>
                                    <FontAwesomeIcon icon={faMagnifyingGlass} size="lg" />
                                </HStack>
                            </Button>
                            {authPostCheckError && (
                                <Text color="red.500" fontSize="sm">
                                    {authPostCheckError}
                                </Text>
                            )}
                        </TypeSelector>
                    </HStack>
                </Dialog.Body>
            </Dialog.Content>
        </Modal>
    )
}
