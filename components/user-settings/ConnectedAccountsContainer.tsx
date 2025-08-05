"use client"

import { Spinner, VStack, Text, Box } from "@chakra-ui/react"
import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import ForumAccountsContainer from "./forum-settings/ForumAccountsContainer"
import LinkPrivyAccountsContainer from "./privy-account-settings/LinkPrivyAccountsContainer"
import { faBullhorn, faEnvelope, faMobileScreen, faRightToBracket } from "@fortawesome/free-solid-svg-icons"
import { faDiscord, faGithub, faGoogle, faXTwitter } from "@fortawesome/free-brands-svg-icons"
import { useUser } from "../../contexts/UserContext"
import SettingsGroupContainer from "../ui/SettingsGroupContainer"
import WalletAccountsContainer from "./wallet-settings/WalletAccountsContainer"

export default function ConnectedAccountsContainer({ targetUser }: { targetUser: UserData }) {
    const { loggedInUser } = useUser()

    const isOwner = loggedInUser?.username === targetUser.username

    const Divider = () => {
        return <Box w={"100%"} h={"1px"} borderTop="5px dashed" borderColor="contentBorder" />
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
                        lozengeTypes={["notifications", "private"]}
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
                            lozengeTypes={["comingSoon", "private"]}
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
                            lozengeTypes={["comingSoon", "private"]}
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
                            lozengeTypes={["comingSoon", "private"]}
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
                                    lozengeTypes={["private"]}
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
                                    lozengeTypes={["private"]}
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
