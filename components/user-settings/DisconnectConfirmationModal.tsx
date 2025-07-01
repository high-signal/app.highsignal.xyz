"use client"

import { Text, Button, Dialog, VStack, HStack } from "@chakra-ui/react"
import Modal from "../ui/Modal"
import ModalCloseButton from "../ui/ModalCloseButton"

interface GenericConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    name: string
    refreshConnectionOption?: boolean
}

export default function GenericConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    name,
    refreshConnectionOption = false,
}: GenericConfirmModalProps) {
    return (
        <Modal open={isOpen} close={onClose} placement={{ base: "top", md: "center" }}>
            <Dialog.Content borderRadius={{ base: "0px", md: "16px" }} p={0} bg={"pageBackground"}>
                <Dialog.Header>
                    <Dialog.Title overflow={"hidden"}>
                        <Text fontWeight="bold" pr={5}>
                            Remove your {name} account
                        </Text>
                        <ModalCloseButton onClose={onClose} />
                    </Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                    <VStack gap={2} alignItems={"start"}>
                        <Text>Are you sure you want to remove your {name} account?</Text>
                        <Text>This will remove all your {name} engagement data and reduce your High Signal score.</Text>
                        {refreshConnectionOption && (
                            <Text>
                                If you want to update your or change the connection method, you can use the{" "}
                                <Text as="span" fontWeight="bold">
                                    Refresh connection
                                </Text>{" "}
                                button instead.
                            </Text>
                        )}
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
                                onConfirm()
                            }}
                        >
                            <Text>Yes I&apos;m sure - Remove</Text>
                        </Button>
                    </HStack>
                </Dialog.Footer>
            </Dialog.Content>
        </Modal>
    )
}
