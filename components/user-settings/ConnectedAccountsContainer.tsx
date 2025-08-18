"use client"

import { useEffect, useState } from "react"

import { Spinner, VStack, Text } from "@chakra-ui/react"
import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import ForumAccountsContainer from "./forum-settings/ForumAccountsContainer"
import LinkPrivyAccountsContainer from "./privy-account-settings/LinkPrivyAccountsContainer"
import { faBullhorn, faEnvelope, faMobileScreen, faRightToBracket } from "@fortawesome/free-solid-svg-icons"
import { faDiscord, faGithub, faGoogle, faXTwitter } from "@fortawesome/free-brands-svg-icons"
import { useUser } from "../../contexts/UserContext"
import SettingsGroupContainer from "../ui/SettingsGroupContainer"
import WalletAccountsContainer from "./wallet-settings/WalletAccountsContainer"
import { getAccessToken } from "@privy-io/react-auth"
import Divider from "../ui/Divider"

export default function ConnectedAccountsContainer({ targetUser }: { targetUser: UserData }) {
    const { loggedInUser } = useUser()

    const isOwner = loggedInUser?.username === targetUser.username

    // Lookup all user_accounts for the target user
    const [publicAndSharedUserAccounts, setPublicAndSharedUserAccounts] = useState<UserPublicOrSharedAccount[]>([])
    useEffect(() => {
        const fetchPublicAndSharedUserAccounts = async () => {
            const token = await getAccessToken()
            const publicAndSharedUserAccountsResponse = await fetch(
                `/api/settings/u/accounts/privy-accounts?username=${targetUser.username}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            )
            const publicAndSharedUserAccounts = await publicAndSharedUserAccountsResponse.json()
            setPublicAndSharedUserAccounts(publicAndSharedUserAccounts)
        }
        fetchPublicAndSharedUserAccounts()
    }, [targetUser])

    function checkSharingStatus(userColumnName: string) {
        const account = publicAndSharedUserAccounts.find((account) => account.type === userColumnName)
        if (account) {
            // Check if the account is public
            if (account.isPublic) {
                return "public"
            }

            // Check if the account has any shared entries
            if (account.userAccountsShared && account.userAccountsShared.length > 0) {
                return "shared_account"
            }

            // Fallback to private
            return "private"
        }

        // If the account is not found, return private
        return "private"
    }

    return (
        <SettingsSectionContainer>
            {!targetUser ? (
                <Spinner />
            ) : (
                <VStack w={"100%"} gap={10}>
                    <LinkPrivyAccountsContainer
                        targetUser={targetUser}
                        accountConfig={{
                            type: "email",
                            displayName: "email",
                            logoIcon: faEnvelope,
                            privyLinkMethod: "email",
                        }}
                        disabled={!isOwner}
                        lozengeTypes={["notifications", checkSharingStatus("email")]}
                        sharingConfig={
                            publicAndSharedUserAccounts.find((account) => account.type === "email") || { type: "email" }
                        }
                    />
                    <Divider />
                    <ForumAccountsContainer targetUser={targetUser} disabled={!isOwner} />
                    <Divider />
                    <SettingsGroupContainer icon={faBullhorn} title="Social Accounts" lozengeTypes={["score"]}>
                        <LinkPrivyAccountsContainer
                            targetUser={targetUser}
                            accountConfig={{
                                type: "discordUsername",
                                displayName: "Discord",
                                logoIcon: faDiscord,
                                confirmDelete: true,
                                privyLinkMethod: "discord_oauth",
                            }}
                            disabled={!isOwner}
                            lozengeTypes={[checkSharingStatus("discord_username")]}
                            sharingConfig={
                                publicAndSharedUserAccounts.find((account) => account.type === "discord_username") || {
                                    type: "discord_username",
                                }
                            }
                        />
                        <LinkPrivyAccountsContainer
                            targetUser={targetUser}
                            accountConfig={{
                                type: "xUsername",
                                displayName: "X",
                                logoIcon: faXTwitter,
                                confirmDelete: true,
                                privyLinkMethod: "twitter_oauth",
                            }}
                            disabled={!isOwner}
                            lozengeTypes={["comingSoon", checkSharingStatus("x_username")]}
                            sharingConfig={
                                publicAndSharedUserAccounts.find((account) => account.type === "x_username") || {
                                    type: "x_username",
                                }
                            }
                        />
                        <LinkPrivyAccountsContainer
                            targetUser={targetUser}
                            accountConfig={{
                                type: "farcasterUsername",
                                displayName: "Farcaster",
                                logoIcon: faMobileScreen,
                                confirmDelete: true,
                                privyLinkMethod: "farcaster",
                            }}
                            disabled={!isOwner}
                            lozengeTypes={["comingSoon", checkSharingStatus("farcaster_username")]}
                            sharingConfig={
                                publicAndSharedUserAccounts.find(
                                    (account) => account.type === "farcaster_username",
                                ) || {
                                    type: "farcaster_username",
                                }
                            }
                        />
                    </SettingsGroupContainer>
                    <Divider />
                    <WalletAccountsContainer targetUser={targetUser} disabled={!isOwner} />
                    <Divider />
                    <SettingsGroupContainer icon={faRightToBracket} title="Other log in options">
                        <VStack w={"100%"} gap={4} fontSize="sm" px={2}>
                            <Text>
                                You can add other log in methods to your High Signal account. These are private and are
                                not used to calculate your Signal Score.
                            </Text>
                        </VStack>
                        {isOwner ? (
                            <>
                                <LinkPrivyAccountsContainer
                                    targetUser={targetUser}
                                    accountConfig={{
                                        type: "github",
                                        displayName: "GitHub",
                                        logoIcon: faGithub,
                                        privyLinkMethod: "github",
                                    }}
                                    loginOnly={true}
                                    lozengeTypes={[checkSharingStatus("github")]}
                                    // sharingConfig={
                                    //     publicAndSharedUserAccounts.find((account) => account.type === "github") || {
                                    //         type: "github",
                                    //     }
                                    // }
                                />
                                <LinkPrivyAccountsContainer
                                    targetUser={targetUser}
                                    accountConfig={{
                                        type: "google",
                                        displayName: "Google",
                                        logoIcon: faGoogle,
                                        privyLinkMethod: "google",
                                    }}
                                    loginOnly={true}
                                    lozengeTypes={[checkSharingStatus("google")]}
                                    // sharingConfig={
                                    //     publicAndSharedUserAccounts.find((account) => account.type === "google") || {
                                    //         type: "google",
                                    //     }
                                    // }
                                />
                                {/* TODO: This gives a 401 error when trying to log in and I have no idea why */}
                                {/* <LinkPrivyAccountsContainer
                                    targetUser={targetUser}
                                    accountConfig={{
                                        type: "passkey",
                                        displayName: "Passkey",
                                        logoIcon: faKey,
                                        privyLinkMethod: "passkey",
                                    }}
                                    loginOnly={true}
                                    lozengeTypes={["private"]}
                                /> */}
                                {/* <LinkPrivyAccountsContainer
                                    targetUser={targetUser}
                                    accountConfig={{
                                        type: "telegram",
                                        displayName: "Telegram",
                                        logoIcon: faTelegram,
                                        privyLinkMethod: "telegram",
                                    }}
                                    loginOnly={true}
                                    disabled={true}
                                    lozengeTypes={["comingSoon", "private"]}
                                /> */}
                            </>
                        ) : (
                            <Text color={"orange.500"} textAlign="center" w={"100%"}>
                                Only the owner of this account can edit log in methods.
                            </Text>
                        )}
                    </SettingsGroupContainer>
                </VStack>
            )}
        </SettingsSectionContainer>
    )
}
