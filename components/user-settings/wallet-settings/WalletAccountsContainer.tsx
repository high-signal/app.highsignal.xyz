"use client"

import { VStack, Text, Button } from "@chakra-ui/react"

import { useUser } from "../../../contexts/UserContext"
import { toaster } from "../../ui/toaster"

import { faEthereum } from "@fortawesome/free-brands-svg-icons"
import { getAccessToken, useLinkAccount } from "@privy-io/react-auth"

import SettingsGroupContainer from "../../ui/SettingsGroupContainer"
import WalletAccountsManager from "./WalletAccountsManager"
import { useState } from "react"

export default function WalletAccountsContainer({ targetUser, disabled }: { targetUser: UserData; disabled: boolean }) {
    const { refreshUser } = useUser()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { linkWallet } = useLinkAccount({
        onSuccess: async () => {
            // Call the API to update the Privy accounts
            const token = await getAccessToken()
            await fetch(`/api/settings/u/accounts/privy-accounts?username=${targetUser.username}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            // Refresh the user data to update the targetUser state
            await refreshUser()

            // Reset the submitting state
            setIsSubmitting(false)

            toaster.create({
                title: `✅ Address confirmed`,
                description: `You have successfully confirmed ownership of your address.`,
                type: "success",
            })
        },
        onError: (error) => {
            console.error(`Failed to link address:`, error)
            toaster.create({
                title: `❌ Error confirming address`,
                description: `Failed to confirm ownership of your address. Please try again.`,
                type: "error",
            })
            setIsSubmitting(false)
        },
    })

    return (
        <SettingsGroupContainer icon={faEthereum} title="Ethereum Addresses" lozengeTypes={[]}>
            <VStack w={"100%"} gap={4} fontSize="sm" px={2}>
                <Text>By default, addresses are private and are not used to calculate your Signal Score.</Text>
                <Text>
                    You can share an address with specific projects, or make it public to be visible to all projects and
                    users.
                </Text>
            </VStack>
            <Button
                primaryButton
                h={"35px"}
                w={"100%"}
                borderRadius="full"
                onClick={() => {
                    setIsSubmitting(true)
                    linkWallet()
                }}
                fontWeight="bold"
                disabled={disabled}
                loading={isSubmitting}
            >
                Confirm a
                {targetUser && targetUser?.userAddresses && targetUser?.userAddresses?.length > 0 ? "nother" : "n"}{" "}
                address
            </Button>
            {targetUser.userAddresses
                ?.sort((a, b) => {
                    // If both have addressName, sort alphabetically
                    if (a.addressName && b.addressName) {
                        return a.addressName.localeCompare(b.addressName)
                    }
                    // If only a has addressName, a comes first
                    if (a.addressName && !b.addressName) {
                        return -1
                    }
                    // If only b has addressName, b comes first
                    if (!a.addressName && b.addressName) {
                        return 1
                    }
                    // If neither has addressName, sort by address
                    return a.address.localeCompare(b.address)
                })
                .map((userAddressConfig, index) => {
                    return (
                        <WalletAccountsManager key={index} userAddressConfig={userAddressConfig} disabled={disabled} />
                    )
                })}
        </SettingsGroupContainer>
    )
}
