"use client"

import { VStack, Text, Button, HStack, Dialog } from "@chakra-ui/react"

import Modal from "./Modal"
import ModalCloseButton from "./ModalCloseButton"

interface EditorModalProps {
    children: React.ReactNode
    isOpen: boolean
    handleClose: () => void
    hasChanges: boolean
    title: string
    titleRight?: React.ReactNode
    isSaving?: boolean
    handleSave?: () => void
    disabled?: boolean
    maxWidth?: string
    saveButtonText?: string
}

export default function EditorModal({
    children,
    isOpen,
    handleClose,
    hasChanges,
    title,
    titleRight,
    isSaving,
    handleSave,
    disabled,
    maxWidth = "600px",
    saveButtonText = "Save changes",
}: EditorModalProps) {
    return (
        <Modal open={isOpen} close={handleClose} closeOnInteractOutside={!hasChanges}>
            <Dialog.Content borderRadius={{ base: "0px", sm: "16px" }} p={0} bg={"pageBackground"} maxW={maxWidth}>
                <Dialog.Header>
                    <Dialog.Title maxW={"100%"}>
                        <HStack flexWrap="wrap" pr={5}>
                            <Text fontWeight="bold">{title}</Text>
                            {titleRight}
                        </HStack>
                        <ModalCloseButton onClose={handleClose} />
                    </Dialog.Title>
                </Dialog.Header>
                <Dialog.Body py={6} borderTop={"2px solid"} borderColor={"contentBorder"}>
                    <VStack gap={8} alignItems={"start"}>
                        {children}
                    </VStack>
                </Dialog.Body>
                <Dialog.Footer>
                    <HStack minW={"100%"} justifyContent={{ base: "center", sm: "end" }} flexWrap={"wrap"} gap={5}>
                        <Button secondaryButton borderRadius={"full"} px={4} py={2} onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            primaryButton
                            borderRadius={"full"}
                            px={4}
                            py={2}
                            disabled={disabled}
                            onClick={handleSave}
                            loading={isSaving}
                        >
                            <Text>{saveButtonText}</Text>
                        </Button>
                    </HStack>
                </Dialog.Footer>
            </Dialog.Content>
        </Modal>
    )
}
