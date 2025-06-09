"use client"

import { Text, Button, Dialog } from "@chakra-ui/react"
import Modal from "../../ui/Modal"

interface ConnectTypeSelectorModalProps {
    isOpen: boolean
    onClose: () => void
    projectDisplayName: string
    forumAuthTypes: string[] | undefined
}

export default function ConnectTypeSelectorModal({
    isOpen,
    onClose,
    projectDisplayName,
    forumAuthTypes,
}: ConnectTypeSelectorModalProps) {
    return (
        <Modal open={isOpen} close={onClose}>
            <Dialog.Content borderRadius={"16px"} p={0} bg={"pageBackground"}>
                <Dialog.Header>
                    <Dialog.Title>
                        <Text fontWeight="bold">Connect your {projectDisplayName} forum account</Text>
                    </Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                    <Text>{JSON.stringify(forumAuthTypes)}</Text>
                </Dialog.Body>
                <Dialog.Footer>
                    <Button secondaryButton borderRadius={"full"} px={4} py={2} onClick={onClose}>
                        No - Take me back
                    </Button>
                    <Button dangerButton borderRadius={"full"} px={4} py={2} onClick={onClose}>
                        <Text>Yes I&apos;m sure - Disconnect</Text>
                    </Button>
                </Dialog.Footer>
            </Dialog.Content>
        </Modal>
    )
}
