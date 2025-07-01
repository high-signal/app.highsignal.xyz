"use client"

import { VStack, Text, Button, useBreakpointValue, HStack, Image, Dialog } from "@chakra-ui/react"

import { faWallet } from "@fortawesome/free-solid-svg-icons"
import { usePrivy } from "@privy-io/react-auth"

import Modal from "../../ui/Modal"
import AccountConnectionManager from "../AccountConnectionManager"
import { ASSETS } from "../../../config/constants"
import { useState } from "react"
import ModalCloseButton from "../../ui/ModalCloseButton"

export default function WalletAccountsManager({
    userAddress,
    disabled,
    index,
}: {
    userAddress: UserAddress
    disabled: boolean
    index: number
}) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const { unlinkWallet } = usePrivy()

    const truncatedAddress = useBreakpointValue({
        base: `${userAddress.address.slice(0, 5)}...${userAddress.address.slice(-5)}`,
        sm: `${userAddress.address.slice(0, 10)}...${userAddress.address.slice(-10)}`,
    })

    const lozengeTypes: LozengeType[] = userAddress.isPublic
        ? ["public"]
        : userAddress.userAddressesShared.length > 0
          ? ["shared"]
          : ["private"]

    return (
        <AccountConnectionManager
            key={userAddress.address}
            config={{
                connectionType: "wallet",
                displayName: userAddress.addressName || `Address ${index + 1}`,
                logoIcon: faWallet,
            }}
            isConnected={true}
            isConnectedLoading={false}
            connectionValue={truncatedAddress || ""}
            connectionValueFontFamily={"monospace"}
            isSubmitting={false}
            onConnect={() => {}}
            onDisconnect={() => {
                unlinkWallet(userAddress.address)
            }}
            getConnectionDescription={() => {
                if (userAddress.userAddressesShared.length > 0) {
                    return (
                        <VStack w={"100%"} alignItems="start">
                            <HStack fontSize="sm" pt={1} px={2} mt={2} flexWrap="wrap">
                                <Text fontWeight="bold">You have shared this address with:</Text>
                                <HStack flexWrap="wrap">
                                    {userAddress.userAddressesShared
                                        .sort((a, b) => a.projectDisplayName.localeCompare(b.projectDisplayName))
                                        .map((shared) => (
                                            <HStack
                                                key={shared.projectUrlSlug}
                                                bg={"contentBackground"}
                                                pl={1}
                                                pr={2}
                                                py={1}
                                                borderRadius="full"
                                                cursor="default"
                                            >
                                                <Image
                                                    src={
                                                        !shared.projectLogoUrl || shared.projectLogoUrl === ""
                                                            ? ASSETS.DEFAULT_PROFILE_IMAGE
                                                            : shared.projectLogoUrl
                                                    }
                                                    alt={`${shared.projectDisplayName} Logo`}
                                                    fit="cover"
                                                    transition="transform 0.2s ease-in-out"
                                                    w="25px"
                                                    borderRadius="full"
                                                />
                                                <Text>{shared.projectDisplayName}</Text>
                                            </HStack>
                                        ))}
                                </HStack>
                            </HStack>
                        </VStack>
                    )
                } else {
                    return null
                }
            }}
            disabled={disabled}
            lozengeTypes={lozengeTypes}
            loginOnly={false}
            onEditButton={() => {
                setIsEditModalOpen(true)
            }}
        >
            <Modal open={isEditModalOpen} close={() => setIsEditModalOpen(false)}>
                <Dialog.Content borderRadius={{ base: "0px", md: "16px" }} p={0} bg={"pageBackground"}>
                    <Dialog.Header>
                        <Dialog.Title>
                            <HStack flexWrap="wrap">
                                <Text fontWeight="bold" pr={10}>
                                    Edit settings for address:
                                </Text>
                                <Text fontSize="sm">{userAddress.address}</Text>
                            </HStack>
                            <ModalCloseButton onClose={() => setIsEditModalOpen(false)} />
                        </Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>
                        <VStack gap={2} alignItems={"start"}>
                            <Text>Edit settings here...</Text>
                        </VStack>
                    </Dialog.Body>
                    <Dialog.Footer>
                        <HStack minW={"100%"} justifyContent={{ base: "center", md: "end" }} flexWrap={"wrap"} gap={5}>
                            <Button
                                secondaryButton
                                borderRadius={"full"}
                                px={4}
                                py={2}
                                onClick={() => setIsEditModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                primaryButton
                                borderRadius={"full"}
                                px={4}
                                py={2}
                                onClick={() => {
                                    // TODO: Implement save functionality
                                    setIsEditModalOpen(false)
                                }}
                            >
                                <Text>Save changes</Text>
                            </Button>
                        </HStack>
                    </Dialog.Footer>
                </Dialog.Content>
            </Modal>
        </AccountConnectionManager>
    )
}
