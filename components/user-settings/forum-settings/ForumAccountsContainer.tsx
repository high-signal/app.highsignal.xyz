"use client"

import { VStack, Text, HStack, Button, Spinner } from "@chakra-ui/react"
import { useState } from "react"
import ProjectPicker from "../../ui/ProjectPicker"
import { useGetProjects } from "../../../hooks/useGetProjects"
import ForumConnectionManager from "./ForumConnectionManager"
import { faDiscourse } from "@fortawesome/free-brands-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

export default function ForumAccountsContainer({ targetUser }: { targetUser: UserData }) {
    const { projects, loading: projectsLoading } = useGetProjects()
    const [selectedProjectToConnect, setSelectedProjectToConnect] = useState<ProjectData | null>(null)

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

    // Separate connected and available forum configs
    const connectedForumConfigs = forumConfigs.filter((config) => {
        const forumUser = targetUser.forumUsers?.find((forumUser) => forumUser.projectUrlSlug === config.projectUrlSlug)
        return forumUser?.forumUsername
    })

    const availableForumConfigs = forumConfigs.filter((config) => {
        const forumUser = targetUser.forumUsers?.find((forumUser) => forumUser.projectUrlSlug === config.projectUrlSlug)
        return !forumUser?.forumUsername
    })

    const handleProjectSelect = (project: ProjectData) => {
        setSelectedProjectToConnect(project)
    }

    // Convert selected project to forum config format
    const selectedConfig = selectedProjectToConnect
        ? {
              projectDisplayName: selectedProjectToConnect.displayName,
              projectUrlSlug: selectedProjectToConnect.urlSlug,
              projectLogoUrl: selectedProjectToConnect.projectLogoUrl,
              forumUrl: selectedProjectToConnect.signalStrengths.find((signal) => signal.name === "discourse_forum")
                  ?.url,
              forumAuthTypes: selectedProjectToConnect.signalStrengths.find(
                  (signal) => signal.name === "discourse_forum",
              )?.authTypes,
              forumAuthParentPostUrl: selectedProjectToConnect.signalStrengths.find(
                  (signal) => signal.name === "discourse_forum",
              )?.authParentPostUrl,
          }
        : null

    // Check if selected project is already connected
    const isSelectedProjectConnected = selectedConfig
        ? targetUser.forumUsers?.some(
              (forumUser) => forumUser.projectUrlSlug === selectedConfig.projectUrlSlug && forumUser.forumUsername,
          )
        : false

    return (
        <VStack w="100%" bg="contentBackground" borderRadius="16px" px={3} py={4} gap={4} alignItems="start">
            <HStack fontWeight="bold" fontSize="lg" pl={3} gap={2}>
                <FontAwesomeIcon icon={faDiscourse} size="lg" />
                <Text>Forum Accounts</Text>
            </HStack>
            <VStack w={"100%"} gap={4}>
                {projectsLoading ? (
                    <Spinner />
                ) : (
                    <>
                        {/* Show connected forum accounts */}
                        {connectedForumConfigs.length > 0 && (
                            <VStack gap={6} w="100%">
                                {connectedForumConfigs.map((config, index) => (
                                    <ForumConnectionManager key={index} targetUser={targetUser} config={config} />
                                ))}
                            </VStack>
                        )}
                        {/* Show dropdown for connecting to new projects */}
                        {availableForumConfigs.length > 0 && (
                            <VStack gap={4} alignItems="start" w="100%">
                                <HStack w="100%">
                                    <ProjectPicker
                                        onProjectSelect={handleProjectSelect}
                                        selectorText={`Select ${selectedProjectToConnect ? "another" : "a"} forum to connect...`}
                                        placeholder={"Search..."}
                                    />
                                    {selectedProjectToConnect && (
                                        <Button
                                            secondaryButton
                                            borderRadius="full"
                                            px={3}
                                            py={1}
                                            h={"35px"}
                                            onClick={() => setSelectedProjectToConnect(null)}
                                            display={{ base: "none", sm: "flex" }}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </HStack>
                                {selectedConfig &&
                                    (isSelectedProjectConnected ? (
                                        <Text color="green.500" fontSize="sm" pl={4}>
                                            You are already connected to {selectedConfig.projectDisplayName} forum
                                        </Text>
                                    ) : (
                                        <ForumConnectionManager targetUser={targetUser} config={selectedConfig} />
                                    ))}
                            </VStack>
                        )}
                    </>
                )}
            </VStack>
        </VStack>
    )
}
