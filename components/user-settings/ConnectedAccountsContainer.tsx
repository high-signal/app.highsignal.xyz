"use client"

import { Spinner, VStack } from "@chakra-ui/react"
import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import ForumAccountsContainer from "./forum-settings/ForumAccountsContainer"
import LinkDiscordContainer from "./LinkDiscordContainer"
import LinkEmailContainer from "./LinkEmailContainer"

export default function ConnectedAccountsContainer({ targetUser }: { targetUser: UserData }) {
    return (
        <SettingsSectionContainer>
            {!targetUser ? (
                <Spinner />
            ) : (
                <VStack w={"100%"} gap={6}>
                    <LinkEmailContainer />
                    <LinkDiscordContainer />
                    <ForumAccountsContainer targetUser={targetUser} />
                </VStack>
            )}
        </SettingsSectionContainer>
    )
}
