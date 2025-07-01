"use client"

import { VStack, Text, Button, useBreakpointValue } from "@chakra-ui/react"

import { faWallet } from "@fortawesome/free-solid-svg-icons"
import { useLinkAccount, usePrivy } from "@privy-io/react-auth"

import SettingsGroupContainer from "../ui/SettingsGroupContainer"
import AccountConnectionManager from "./AccountConnectionManager"

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
                        disabled={disabled}
                        lozengeTypes={lozengeTypes}
                        loginOnly={false}
                    />
                )
            })}
        </SettingsGroupContainer>
    )
}
