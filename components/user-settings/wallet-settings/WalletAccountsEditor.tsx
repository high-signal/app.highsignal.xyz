"use client"

import { VStack, Text, Button, HStack, Dialog } from "@chakra-ui/react"
import Modal from "../../ui/Modal"
import { useState } from "react"
import ModalCloseButton from "../../ui/ModalCloseButton"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCopy } from "@fortawesome/free-solid-svg-icons"
import { faCheckCircle } from "@fortawesome/free-regular-svg-icons"

export default function WalletAccountsEditor({
    isOpen,
    onClose,
    userAddress,
}: {
    isOpen: boolean
    onClose: () => void
    userAddress: UserAddress
}) {
    const [isCopied, setIsCopied] = useState(false)

    const handleCopyAddress = async () => {
        try {
            await navigator.clipboard.writeText(userAddress.address)
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy address:", err)
        }
    }
    return (
        <Modal open={isOpen} close={onClose}>
            <Dialog.Content
                borderRadius={{ base: "0px", md: "16px" }}
                p={0}
                bg={"pageBackground"}
                maxW={"900px"}
                minH={"50dvh"}
            >
                <Dialog.Header>
                    <Dialog.Title maxW={"100%"}>
                        <HStack flexWrap="wrap">
                            <Text fontWeight="bold" pr={3}>
                                Edit settings for address:
                            </Text>
                            <HStack bg={"contentBackground"} borderRadius={"full"} gap={0}>
                                <Text
                                    fontSize={"md"}
                                    fontFamily={"monospace"}
                                    wordBreak="break-all"
                                    px={{ base: 6, md: 3 }}
                                    py={{ base: 2, md: 1 }}
                                >
                                    {userAddress.address}
                                </Text>
                                <Button
                                    secondaryButton
                                    onClick={handleCopyAddress}
                                    borderRadius="full"
                                    pl={2}
                                    pr={3}
                                    mr={{ base: 3, md: 0 }}
                                    py={1}
                                    h={"36px"}
                                >
                                    <HStack gap={1}>
                                        <FontAwesomeIcon icon={isCopied ? faCheckCircle : faCopy} />
                                        <Text fontSize="sm" fontWeight="bold">
                                            {isCopied ? "Copied" : "Copy"}
                                        </Text>
                                    </HStack>
                                </Button>
                            </HStack>
                        </HStack>
                        <ModalCloseButton onClose={onClose} />
                    </Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                    <VStack gap={2} alignItems={"start"}>
                        <Text>Edit settings here...</Text>
                    </VStack>
                </Dialog.Body>
                <Dialog.Footer>
                    <HStack minW={"100%"} justifyContent={{ base: "center", md: "end" }} flexWrap={"wrap"} gap={5}>
                        <Button secondaryButton borderRadius={"full"} px={4} py={2} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            primaryButton
                            borderRadius={"full"}
                            px={4}
                            py={2}
                            onClick={() => {
                                // TODO: Implement save functionality
                                onClose()
                            }}
                        >
                            <Text>Save changes</Text>
                        </Button>
                    </HStack>
                </Dialog.Footer>
            </Dialog.Content>
        </Modal>
    )
}
