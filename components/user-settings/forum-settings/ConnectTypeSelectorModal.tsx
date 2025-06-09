"use client"

import { HStack, VStack, Text, Button, Dialog, Spinner } from "@chakra-ui/react"
import Modal from "../../ui/Modal"

interface ConnectTypeSelectorModalProps {
    isOpen: boolean
    onClose: () => void
    projectDisplayName: string
    forumUrl: string | undefined
    forumAuthTypes: string[] | undefined
    isForumSubmitting: boolean
    handleForumAuthApi: () => void
}

export default function ConnectTypeSelectorModal({
    isOpen,
    onClose,
    projectDisplayName,
    forumUrl,
    forumAuthTypes,
    isForumSubmitting,
    handleForumAuthApi,
}: ConnectTypeSelectorModalProps) {
    const TypeSelector = ({
        enabled,
        title,
        children,
    }: {
        enabled: boolean | undefined
        title: string
        children: React.ReactNode
    }) => {
        return (
            <VStack
                flex="1"
                bg={"contentBackground"}
                borderRadius={"16px"}
                p={4}
                mx={2}
                w={"100%"}
                minW={"400px"}
                justifyContent={"start"}
                alignItems={"center"}
                h={"100%"}
            >
                <Text fontWeight={"bold"}>{title}</Text>
                {children}
                {!enabled && <Text>This authentication method has not been enabled by {projectDisplayName}.</Text>}
            </VStack>
        )
    }

    return (
        <Modal open={isOpen} close={onClose} placement={{ base: "top", md: "top" }}>
            <Dialog.Content borderRadius={"16px"} p={0} bg={"pageBackground"} maxW={"1000px"} mx={"20px"}>
                <Dialog.Header>
                    <Dialog.Title textAlign={"center"}>
                        <Text fontWeight="bold">Connect your {projectDisplayName} forum account</Text>
                    </Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                    <HStack flexWrap={"wrap"} alignItems={"start"}>
                        <TypeSelector enabled={forumAuthTypes?.includes("api_auth")} title="Automatic API connection">
                            <VStack>
                                <Text>
                                    Connect your {projectDisplayName} forum account to High Signal to confirm ownership.
                                </Text>
                                <Text>
                                    Clicking the &quot;Connect&quot; button will redirect you to {forumUrl} forum where
                                    you will be asked to &quot;Authorize&quot; High Signal to &quot;Read user session
                                    info&quot;.
                                </Text>
                                <Text>
                                    This will allow High Signal to confirm you are the owner of this forum account but
                                    does not allow any other actions.
                                </Text>
                                <Button
                                    primaryButton
                                    h={"40px"}
                                    w={"100%"}
                                    onClick={handleForumAuthApi}
                                    borderRadius="full"
                                    disabled={!forumAuthTypes?.includes("api_auth") || isForumSubmitting}
                                >
                                    {isForumSubmitting ? (
                                        <Spinner size="sm" color="white" />
                                    ) : (
                                        <Text fontWeight="bold">Connect</Text>
                                    )}
                                </Button>
                            </VStack>
                        </TypeSelector>
                        <TypeSelector
                            enabled={forumAuthTypes?.includes("manual_post")}
                            title="Confirm forum account by posting a public message"
                        >
                            <Text>
                                This method will allow you to manually connect your {projectDisplayName} forum account
                                to your {projectDisplayName} account.
                            </Text>
                        </TypeSelector>
                    </HStack>
                </Dialog.Body>
            </Dialog.Content>
        </Modal>
    )
}
