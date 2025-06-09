"use client"

import { Text, Button, Dialog, VStack, HStack } from "@chakra-ui/react"
import Modal from "../../ui/Modal"

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
                        <Text fontWeight="bold">Disconnect your {projectDisplayName} forum account</Text>
                    </Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                    <VStack gap={2} alignItems={"start"}>
                        <Text>Are you sure you want to disconnect your {projectDisplayName} forum account?</Text>
                        <Text>This will remove all your engagement data for this project and reduce your score.</Text>
                        <Text>
                            If you want to update your forum username, you can use the &quot;Refresh connection&quot;
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
