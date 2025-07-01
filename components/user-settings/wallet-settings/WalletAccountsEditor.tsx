"use client"

import { VStack, Text, Button, HStack, Dialog, RadioGroup } from "@chakra-ui/react"
import Modal from "../../ui/Modal"
import { useState } from "react"
import ModalCloseButton from "../../ui/ModalCloseButton"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCopy, faXmark } from "@fortawesome/free-solid-svg-icons"
import { faCheckCircle } from "@fortawesome/free-regular-svg-icons"
import SingleLineTextInput from "../../ui/SingleLineTextInput"
import { CustomRadioItem } from "../../ui/CustomRadioGroup"

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
                            <Text fontWeight="bold">Edit settings for address</Text>
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
                    <VStack gap={6} alignItems={"start"}>
                        <HStack w={"100%"} gap={2}>
                            <Text fontWeight={"bold"} fontSize={"md"}>
                                Address name
                            </Text>
                            <SingleLineTextInput
                                value={userAddress.addressName || ""}
                                onChange={(e) => {
                                    // TODO: Implement save functionality
                                }}
                                maxW={"200px"}
                                minW={"100px"}
                                h={"36px"}
                            />
                        </HStack>
                        <VStack w={"100%"} alignItems={"start"} gap={3}>
                            <Text fontWeight={"bold"} fontSize={"md"}>
                                Sharing settings
                            </Text>
                            <VStack>
                                <RadioGroup.Root
                                // value={sharingSettings}
                                // onValueChange={(details) => {
                                //     // TODO: Implement sharing settings change
                                // }}
                                >
                                    <VStack gap={6} alignItems={"start"} w={"100%"}>
                                        {[
                                            {
                                                value: "private",
                                                text: "Private",
                                                bgColor: "blue.800",
                                                borderColor: "transparent",
                                                textColor: "blue.100",
                                                itemBackground: "contentBackground",
                                                tip: "Private addresses are not visible to other users.",
                                            },
                                            {
                                                value: "public",
                                                text: "Public",
                                                bgColor: "green.500",
                                                borderColor: "transparent",
                                                textColor: "white",
                                                itemBackground: "contentBackground",
                                                tip: "Public addresses are visible to everyone.",
                                            },
                                            {
                                                value: "shared",
                                                text: "Shared",
                                                bgColor: "teal.500",
                                                borderColor: "transparent",
                                                textColor: "white",
                                                itemBackground: "contentBackground",
                                                tip: "Share this address with selected projects. Only the address is shared, not any custom name you have set.",
                                            },
                                        ].map((option) => (
                                            <HStack
                                                key={option.value}
                                                gap={4}
                                                alignItems={{ base: "start", md: "center" }}
                                            >
                                                <HStack minW={"110px"}>
                                                    <CustomRadioItem option={option} />
                                                </HStack>
                                                <Text fontSize={"sm"} color={"textColorMuted"}>
                                                    {option.tip}
                                                </Text>
                                            </HStack>
                                        ))}
                                    </VStack>
                                </RadioGroup.Root>
                            </VStack>
                            <HStack bg={"contentBackground"} borderRadius={"16px"} p={4} w={"100%"} flexWrap={"wrap"}>
                                <Text>(Project Picker - Select projects to share this address with)</Text>
                                <HStack>
                                    <HStack
                                        pl={3}
                                        pr={2}
                                        py={1}
                                        bg={"pageBackground"}
                                        borderRadius={"full"}
                                        fontSize={"md"}
                                        gap={3}
                                    >
                                        <Text>Project 1</Text>
                                        <FontAwesomeIcon icon={faXmark} />
                                    </HStack>
                                </HStack>
                            </HStack>
                        </VStack>
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
