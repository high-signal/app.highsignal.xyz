"use client"

import { HStack, VStack, Text, Button, Dialog, Spinner } from "@chakra-ui/react"
import Modal from "../../ui/Modal"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCopy } from "@fortawesome/free-solid-svg-icons"
import { useState } from "react"
import { faCheckCircle } from "@fortawesome/free-regular-svg-icons"

interface ConnectTypeSelectorModalProps {
    isOpen: boolean
    onClose: () => void
    projectDisplayName: string
    forumAuthTypes: string[] | undefined
    isForumSubmitting: boolean
    handleForumAuthApi: () => void
}

export default function ConnectTypeSelectorModal({
    isOpen,
    onClose,
    projectDisplayName,
    forumAuthTypes,
    isForumSubmitting,
    handleForumAuthApi,
}: ConnectTypeSelectorModalProps) {
    const [isCodeCopied, setIsCodeCopied] = useState(false)

    const authCodePost =
        "This post is to connect my forum account to my High Signal account. My auth code is: 1234-ABCD-1234-ABCD"

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
            >
                <VStack fontWeight={"bold"} fontSize={"md"} textAlign={"center"} gap={3}>
                    <Text color={"green.500"}>{option}</Text>
                    <Text fontSize={"lg"} pb={1}>
                        {title}
                    </Text>
                </VStack>
                <VStack gap={3} textAlign={"center"} maxW={"100%"}>
                    {children}
                </VStack>
            </VStack>
        )
    }

    return (
        <Modal open={isOpen} close={onClose} placement={{ base: "top", md: "top" }}>
            <Dialog.Content
                borderRadius={{ base: "0px", md: "16px" }}
                p={0}
                bg={"pageBackground"}
                maxW={"1200px"}
                mx={{ base: 0, md: "20px" }}
            >
                <Dialog.Header>
                    <Dialog.Title textAlign={"center"}>
                        <Text fontWeight="bold">Connect your {projectDisplayName} forum account</Text>
                    </Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                    <HStack flexWrap={"wrap"} alignItems={"start"}>
                        <TypeSelector option="Option 1 (Recommended)" title="Automatic API connection">
                            <Text>
                                Connect your {projectDisplayName} forum account to High Signal to confirm ownership.
                            </Text>
                            <Text>
                                Clicking the{" "}
                                <Text as="span" fontWeight={"bold"}>
                                    Connect
                                </Text>{" "}
                                button will redirect you to {projectDisplayName} forum where you will be asked to{" "}
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
                                This will allow High Signal to confirm you are the owner of your {projectDisplayName}{" "}
                                forum account but does not allow any other actions.
                            </Text>
                            <Button
                                {...(forumAuthTypes?.includes("api_auth")
                                    ? { primaryButton: true }
                                    : { contentButton: true })}
                                minH={"40px"}
                                w={"100%"}
                                onClick={handleForumAuthApi}
                                borderRadius="full"
                                disabled={!forumAuthTypes?.includes("api_auth") || isForumSubmitting}
                                mt={2}
                            >
                                {isForumSubmitting ? (
                                    <Spinner size="sm" color="white" />
                                ) : forumAuthTypes?.includes("api_auth") ? (
                                    <Text fontWeight="bold" whiteSpace="normal" py={0} px={0}>
                                        Connect
                                    </Text>
                                ) : (
                                    <Text fontWeight="bold" whiteSpace="normal" py={2} px={4}>
                                        This authentication method has not been enabled by {projectDisplayName}
                                    </Text>
                                )}
                            </Button>
                        </TypeSelector>
                        <TypeSelector option="Option 2" title="Post a public message">
                            <Text>
                                This method will allow you to manually connect your {projectDisplayName} forum account
                                to your {projectDisplayName} account.
                            </Text>
                            <Text>Copy this message with your access code:</Text>
                            <VStack gap={2}>
                                <Text bg={"pageBackground"} py={2} px={4} borderRadius={"16px"} fontWeight={"bold"}>
                                    {authCodePost}
                                </Text>
                                <Button
                                    contentButton
                                    h={"100%"}
                                    pl={3}
                                    pr={2}
                                    py={1}
                                    borderRadius={"full"}
                                    onClick={() => handleCopyCode(authCodePost)}
                                >
                                    <HStack gap={2} justifyContent={"start"}>
                                        <Text>{isCodeCopied ? "Copied" : "Copy message"}</Text>
                                        <FontAwesomeIcon icon={isCodeCopied ? faCheckCircle : faCopy} size="lg" />
                                    </HStack>
                                </Button>
                            </VStack>
                            <Text>
                                Post this message on the {projectDisplayName} forum on the dedicated topic for High
                                Signal authentication:
                            </Text>
                            <Text>LINK</Text>
                            <Text>
                                Once you have posted the message, click the{" "}
                                <Text as="span" fontWeight={"bold"}>
                                    Check forum post
                                </Text>{" "}
                                button to confirm you are the owner of your {projectDisplayName} forum account.
                            </Text>
                            <Button
                                primaryButton
                                minH={"40px"}
                                w={"100%"}
                                // onClick={handleForumAuthPost}
                                borderRadius="full"
                                disabled={isForumSubmitting}
                                mt={2}
                            >
                                {isForumSubmitting ? (
                                    <Spinner size="sm" color="white" />
                                ) : (
                                    <Text fontWeight="bold" whiteSpace="normal" py={0} px={0}>
                                        Check forum post
                                    </Text>
                                )}
                            </Button>
                        </TypeSelector>
                    </HStack>
                </Dialog.Body>
            </Dialog.Content>
        </Modal>
    )
}
