"use client"

import { VStack, Text, useBreakpointValue, HStack, Image } from "@chakra-ui/react"

import { faWallet } from "@fortawesome/free-solid-svg-icons"
import { usePrivy } from "@privy-io/react-auth"

import AccountConnectionManager from "../AccountConnectionManager"
import { ASSETS } from "../../../config/constants"
import { useState } from "react"
import WalletAccountsEditor from "./WalletAccountsEditor"
import { useUser } from "../../../contexts/UserContext"
import { toaster } from "../../ui/toaster"

export default function WalletAccountsManager({
    userAddressConfig,
    disabled,
    index,
}: {
    userAddressConfig: UserAddressConfig
    disabled: boolean
    index: number
}) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const { unlinkWallet } = usePrivy()
    const { refreshUser } = useUser()

    const truncatedAddress = useBreakpointValue({
        base: `${userAddressConfig.address.slice(0, 5)}...${userAddressConfig.address.slice(-5)}`,
        sm: `${userAddressConfig.address.slice(0, 10)}...${userAddressConfig.address.slice(-10)}`,
    })

    const lozengeTypes: LozengeType[] = userAddressConfig.isPublic
        ? ["public"]
        : userAddressConfig.userAddressesShared.length > 0
          ? ["shared"]
          : ["private"]

    return (
        <AccountConnectionManager
            key={userAddressConfig.address}
            config={{
                connectionType: "wallet",
                displayName: userAddressConfig.addressName || `Address ${userAddressConfig.address.slice(0, 5)}...`,
                logoIcon: faWallet,
            }}
            isConnected={true}
            isConnectedLoading={false}
            connectionValue={truncatedAddress || ""}
            connectionValueFontFamily={"monospace"}
            isSubmitting={false}
            onConnect={() => {}}
            onDisconnect={async () => {
                try {
                    await unlinkWallet(userAddressConfig.address)
                    refreshUser()
                    toaster.create({
                        title: `✅ Address removed`,
                        description: `Your address has been successfully removed.`,
                        type: "success",
                    })
                } catch (error: any) {
                    console.error("Error unlinking address:", error)
                    toaster.create({
                        title: `❌ Error removing address`,
                        description: `Failed to unlink your address. ${error.message}.`,
                        type: "error",
                    })
                }
            }}
            getConnectionDescription={() => {
                if (userAddressConfig.userAddressesShared.length > 0) {
                    return (
                        <VStack w={"100%"} alignItems="start">
                            <HStack fontSize="sm" pt={1} px={2} mt={2} flexWrap="wrap">
                                <Text fontWeight="bold">You have shared this address with:</Text>
                                <HStack flexWrap="wrap">
                                    {userAddressConfig.userAddressesShared
                                        .sort((a, b) => a.projectDisplayName.localeCompare(b.projectDisplayName))
                                        .map((shared) => (
                                            <HStack
                                                key={shared.projectUrlSlug}
                                                bg={"contentBackground"}
                                                pr={2}
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
                                                    w="35px"
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
            <WalletAccountsEditor
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                userAddressConfig={userAddressConfig}
            />
        </AccountConnectionManager>
    )
}
