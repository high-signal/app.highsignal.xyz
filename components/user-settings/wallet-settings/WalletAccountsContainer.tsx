"use client"

import { VStack, Text, Button } from "@chakra-ui/react"

import { faWallet } from "@fortawesome/free-solid-svg-icons"
import { useLinkAccount } from "@privy-io/react-auth"

import SettingsGroupContainer from "../../ui/SettingsGroupContainer"
import WalletAccountsManager from "./WalletAccountsManager"

export default function WalletAccountsContainer({ targetUser, disabled }: { targetUser: UserData; disabled: boolean }) {
    const { linkWallet } = useLinkAccount()

    return (
        <SettingsGroupContainer icon={faWallet} title="Addresses" lozengeTypes={[]}>
            <VStack w={"100%"} gap={4} fontSize="sm" px={2}>
                <Text>By default, addresses are private and are not used to calculate your Signal Score.</Text>
                <Text>
                    You can share an address with specific projects, or make it public to be visible to all projects and
                    users.
                </Text>
            </VStack>
            <Button primaryButton h={"35px"} w={"100%"} borderRadius="full" onClick={linkWallet} fontWeight="bold">
                Confirm a
                {targetUser && targetUser?.userAddresses && targetUser?.userAddresses?.length > 0 ? "nother" : "n"}{" "}
                address
            </Button>
            {targetUser.userAddresses?.map((userAddress, index) => {
                return <WalletAccountsManager key={index} userAddress={userAddress} disabled={disabled} index={index} />
            })}
        </SettingsGroupContainer>
    )
}
