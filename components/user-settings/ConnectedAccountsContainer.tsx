"use client"

import { Spinner } from "@chakra-ui/react"
import { useGetProjects } from "../../hooks/useGetProjects"
import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import ForumConnectionManager from "./forum-settings/ForumConnectionManager"

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
                forumConfigs.map((config, index) => (
                    <ForumConnectionManager key={index} targetUser={targetUser} config={config} />
                ))
            )}
        </SettingsSectionContainer>
    )
}
