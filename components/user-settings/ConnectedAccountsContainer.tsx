"use client"

import { Spinner } from "@chakra-ui/react"
import { useGetProjects } from "../../hooks/useGetProjects"
import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import ForumConnectionManager from "./ForumConnectionManager"

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
                        projectLogoUrl: project.projectLogoUrl,
                        forumUrl: forumSignal.url,
                    },
                ]
            }
            return []
        })
        .sort((a, b) => a.projectDisplayName.localeCompare(b.projectDisplayName))

    // Make a single call to get all the entries in forum_users for the target user
    //

    return (
        <SettingsSectionContainer>
            {projectsLoading ? (
                <Spinner />
            ) : (
                forumConfigs.map((config, index) => (
                    <ForumConnectionManager key={index} targetUser={targetUser} config={config} />
                ))
            )}
        </SettingsSectionContainer>
    )
}
