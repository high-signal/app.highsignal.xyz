"use client"

import { VStack, Text, Button, useBreakpointValue, HStack, Image } from "@chakra-ui/react"

import { faWallet } from "@fortawesome/free-solid-svg-icons"
import { useLinkAccount, usePrivy } from "@privy-io/react-auth"

import SettingsGroupContainer from "../ui/SettingsGroupContainer"
import AccountConnectionManager from "./AccountConnectionManager"
import { ASSETS } from "../../config/constants"

export default function WalletAccountsContainer({ targetUser, disabled }: { targetUser: UserData; disabled: boolean }) {
    const { linkWallet } = useLinkAccount()
    const { unlinkWallet } = usePrivy()

    return (
        <SettingsGroupContainer icon={faWallet} title="Addresses" lozengeTypes={[]}>
            <VStack w={"100%"} gap={4} fontSize="sm" px={2}>
                <Text>By default, addresses are private and are not used to calculate your Signal Score.</Text>
                <Text>You can select specific projects to be able to see them to verify your address.</Text>
            </VStack>
            <Button primaryButton h={"35px"} w={"100%"} borderRadius="full" onClick={linkWallet}>
                Link address
            </Button>
            {targetUser.userAddresses?.map((userAddress, index) => {
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
                            if (userAddress.isPublic) {
                                return "This address is visible to anyone who views your profile."
                            }

                            if (userAddress.userAddressesShared.length === 0 && !userAddress.isPublic) {
                                return "This address is private and is not visible to any other users."
                            }

                            if (userAddress.userAddressesShared.length > 0) {
                                return (
                                    <HStack fontSize="sm" pt={1} px={2} mt={2} flexWrap="wrap">
                                        <Text fontWeight="bold">You have shared this address with:</Text>
                                        <HStack flexWrap="wrap">
                                            {userAddress.userAddressesShared.map((shared) => (
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
                                )
                            }

                            return null
                        }}
                        disabled={disabled}
                        lozengeTypes={lozengeTypes}
                        loginOnly={false}
                    />
                )
            })}
        </SettingsGroupContainer>
    )
}
