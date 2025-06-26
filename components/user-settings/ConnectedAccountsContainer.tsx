"use client"

import { Spinner, VStack } from "@chakra-ui/react"
import { useGetProjects } from "../../hooks/useGetProjects"
import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import ForumConnectionManager from "./forum-settings/ForumConnectionManager"
import LinkDiscordContainer from "./LinkDiscordContainer"

export default function ConnectedAccountsContainer({ targetUser }: { targetUser: UserData }) {
    const { projects, loading: projectsLoading, error: projectsError } = useGetProjects()

    const forumConfigs = projects
        .flatMap((project) => {
            const forumSignal = project.signalStrengths.find(
                (signal) => signal.name === "discourse_forum" && signal.status === "active" && signal.enabled,
            )
            if (forumSignal) {
                return [
                    {
                        projectDisplayName: project.displayName,
                        projectUrlSlug: project.urlSlug,
                        projectLogoUrl: project.projectLogoUrl,
                        forumUrl: forumSignal.url,
                        forumAuthTypes: forumSignal.authTypes,
                        forumAuthParentPostUrl: forumSignal.authParentPostUrl,
                    },
                ]
            }
            return []
        })
        .sort((a, b) => a.projectDisplayName.localeCompare(b.projectDisplayName))

    return (
        <SettingsSectionContainer>
            {!targetUser || projectsLoading ? (
                <Spinner />
            ) : (
                <VStack w={"100%"} gap={6}>
                    <LinkDiscordContainer />
                    {forumConfigs.map((config, index) => (
                        <ForumConnectionManager key={index} targetUser={targetUser} config={config} />
                    ))}
                </VStack>
            )}
        </SettingsSectionContainer>
    )
}
