"use client"

import { VStack, Text, Button, HStack, Dialog } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTriangleExclamation, faKey } from "@fortawesome/free-solid-svg-icons"

import Modal from "../../ui/Modal"
import ModalCloseButton from "../../ui/ModalCloseButton"

interface ApiKeyConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    description: string
    confirmButtonText: string
    cancelButtonText: string
    onConfirm: () => void
    isGenerating?: boolean
}

export default function ApiKeyConfirmationModal({
    isOpen,
    onClose,
    title,
    description,
    confirmButtonText,
    cancelButtonText,
    onConfirm,
    isGenerating = false,
}: ApiKeyConfirmationModalProps) {
    const handleConfirm = async () => {
        await onConfirm()
        onClose()
    }

    const handleClose = () => {
        onClose()
    }

    return (
        <Modal open={isOpen} close={handleClose} closeOnInteractOutside={true}>
            <Dialog.Content borderRadius={{ base: "0px", sm: "16px" }} p={0} bg={"pageBackground"} maxW={"500px"}>
                <Dialog.Header pt={4}>
                    <Dialog.Title maxW={"100%"}>
                        <HStack gap={3}>
                            <FontAwesomeIcon icon={isGenerating ? faKey : faTriangleExclamation} size="lg" />
                            <Text fontWeight="bold">{title}</Text>
                        </HStack>
                        <ModalCloseButton onClose={handleClose} />
                    </Dialog.Title>
                </Dialog.Header>
                <Dialog.Body py={6} borderTop={"2px solid"} borderColor={"contentBorder"}>
                    <VStack gap={4} alignItems={"start"}>
                        <Text fontSize={"md"}>{description}</Text>
                    </VStack>
                </Dialog.Body>
                <Dialog.Footer>
                    <HStack minW={"100%"} justifyContent={{ base: "center", sm: "end" }} flexWrap={"wrap"} gap={5}>
                        <Button secondaryButton borderRadius={"full"} px={4} py={2} onClick={handleClose}>
                            {cancelButtonText}
                        </Button>
                        <Button
                            dangerButton={!isGenerating}
                            primaryButton={isGenerating}
                            borderRadius={"full"}
                            px={4}
                            py={2}
                            onClick={handleConfirm}
                        >
                            <Text>{confirmButtonText}</Text>
                        </Button>
                    </HStack>
                </Dialog.Footer>
            </Dialog.Content>
        </Modal>
    )
}
