"use client"

import { Spinner, VStack } from "@chakra-ui/react"
import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import ForumAccountsContainer from "./forum-settings/ForumAccountsContainer"
import LinkPrivyAccountsContainer from "./LinkPrivyAccountsContainer"
import { faEnvelope } from "@fortawesome/free-solid-svg-icons"
import { faDiscord } from "@fortawesome/free-brands-svg-icons"

export default function ConnectedAccountsContainer({ targetUser }: { targetUser: UserData }) {
    return (
        <SettingsSectionContainer>
            {!targetUser ? (
                <Spinner />
            ) : (
                <VStack w={"100%"} gap={6}>
                    <LinkPrivyAccountsContainer
                        targetUser={targetUser}
                        accountConfig={{
                            type: "email",
                            displayName: "email",
                            logoIcon: faEnvelope,
                            privyLinkMethod: "email",
                        }}
                    />
                    <LinkPrivyAccountsContainer
                        targetUser={targetUser}
                        accountConfig={{
                            type: "discordUsername",
                            displayName: "Discord",
                            logoIcon: faDiscord,
                            confirmDelete: true,
                            privyLinkMethod: "discord_oauth",
                        }}
                    />
                    <ForumAccountsContainer targetUser={targetUser} />
                </VStack>
            )}
        </SettingsSectionContainer>
    )
}
