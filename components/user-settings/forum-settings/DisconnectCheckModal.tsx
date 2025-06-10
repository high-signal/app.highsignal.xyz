"use client"

import { Text, Button, Dialog, VStack, HStack } from "@chakra-ui/react"
import Modal from "../../ui/Modal"
import { faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

interface DisconnectCheckModalProps {
    isOpen: boolean
    onClose: () => void
    onDisconnect: () => void
    projectDisplayName: string
}

export default function DisconnectCheckModal({
    isOpen,
    onClose,
    onDisconnect,
    projectDisplayName,
}: DisconnectCheckModalProps) {
    return (
        <Modal open={isOpen} close={onClose} placement={{ base: "top", md: "center" }}>
            <Dialog.Content borderRadius={{ base: "0px", md: "16px" }} p={0} bg={"pageBackground"}>
                <Dialog.Header>
                    <Dialog.Title>
                        <Text fontWeight="bold" pr={3}>
                            Disconnect your {projectDisplayName} forum account
                        </Text>
                        <Button
                            closeButton
                            position="absolute"
                            right={{ base: "10px", md: "28px" }}
                            top="28px"
                            onClick={onClose}
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
                    <VStack gap={2} alignItems={"start"}>
                        <Text>Are you sure you want to disconnect your {projectDisplayName} forum account?</Text>
                        <Text>This will remove all your engagement data for this project and reduce your score.</Text>
                        <Text>
                            If you want to update your forum username or change the connection method, you can use the{" "}
                            <Text as="span" fontWeight="bold">
                                Refresh connection
                            </Text>{" "}
                            button instead.
                        </Text>
                    </VStack>
                </Dialog.Body>
                <Dialog.Footer>
                    <HStack minW={"100%"} justifyContent={{ base: "center", md: "end" }} flexWrap={"wrap"} gap={5}>
                        <Button secondaryButton borderRadius={"full"} px={4} py={2} onClick={onClose}>
                            No - Take me back
                        </Button>
                        <Button
                            dangerButton
                            borderRadius={"full"}
                            px={4}
                            py={2}
                            onClick={() => {
                                onClose()
                                onDisconnect()
                            }}
                        >
                            <Text>Yes I&apos;m sure - Disconnect</Text>
                        </Button>
                    </HStack>
                </Dialog.Footer>
            </Dialog.Content>
        </Modal>
    )
}
