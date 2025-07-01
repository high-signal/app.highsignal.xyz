"use client"

import { VStack, Text, Button } from "@chakra-ui/react"

import SettingsGroupContainer from "../ui/SettingsGroupContainer"
import { faWallet } from "@fortawesome/free-solid-svg-icons"
import LinkPrivyAccountsContainer from "./LinkPrivyAccountsContainer"
import { useLinkAccount, usePrivy } from "@privy-io/react-auth"

export default function WalletAccountsContainer({ targetUser, disabled }: { targetUser: UserData; disabled: boolean }) {
    const { linkWallet, linkPasskey } = useLinkAccount()

    const { user: privyUser, unlinkWallet } = usePrivy()

    // console.log(privyUser)

    return (
        <SettingsGroupContainer icon={faWallet} title="Addresses" lozengeTypes={[]}>
            <VStack w={"100%"} gap={4} fontSize="sm" px={2}>
                <Text>By default, addresses are private and are not used to calculate your Signal Score.</Text>
                <Text>You can select specific projects to be able to see them to verify your address.</Text>
            </VStack>
            <Button onClick={linkWallet}>Link Wallet</Button>
            {privyUser?.linkedAccounts.map((wallet) => {
                if ("connectorType" in wallet && wallet.connectorType !== "embedded" && "address" in wallet) {
                    return (
                        <Text fontFamily={"monospace"} key={wallet.address}>
                            {wallet.address.slice(0, 6)}...{wallet.address.slice(-5)}
                        </Text>
                    )
                }
            })}
        </SettingsGroupContainer>
    )
}
