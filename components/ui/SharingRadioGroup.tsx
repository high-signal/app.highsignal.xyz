import { VStack, Text, Button, HStack, RadioGroup, Box, Image } from "@chakra-ui/react"
import { CustomRadioItem } from "./CustomRadioGroup"
import ProjectPicker from "./ProjectPicker"
import { ASSETS } from "../../config/constants"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXmark } from "@fortawesome/free-solid-svg-icons"

interface SharingRadioGroupProps {
    settings: EditorSettingsState
    setSettings: (settings: EditorSettingsState | null) => void
    sharingValidationError: string | null
}

const SharingRadioGroup = ({ settings, setSettings, sharingValidationError }: SharingRadioGroupProps) => {
    // Helper function to get the current list of projects to display
    const getCurrentProjectList = (): SharedProjectData[] => {
        if (!settings) return []
        if (settings.projectsSharedWith?.new !== null) {
            return settings.projectsSharedWith.new || []
        }
        return settings.projectsSharedWith?.current || []
    }

    // Helper function to add a project to the list
    const addProject = (project: { urlSlug: string; displayName: string; projectLogoUrl?: string }) => {
        if (!settings) return

        const currentList = getCurrentProjectList()
        const newProject = {
            projectUrlSlug: project.urlSlug,
            projectDisplayName: project.displayName,
            projectLogoUrl: project.projectLogoUrl,
        }

        // Check if project already exists
        const projectExists = currentList.some((p) => p.projectUrlSlug === project.urlSlug)
        if (projectExists) return

        setSettings({
            ...settings,
            projectsSharedWith: {
                ...settings.projectsSharedWith,
                new: [...currentList, newProject],
            },
        })
    }

    // Helper function to remove a project from the list
    const removeProject = (projectUrlSlug: string) => {
        if (!settings) return

        const currentList = getCurrentProjectList()
        const filteredList = currentList.filter((p) => p.projectUrlSlug !== projectUrlSlug)

        setSettings({
            ...settings,
            projectsSharedWith: {
                ...settings.projectsSharedWith,
                new: filteredList,
            },
        })
    }

    return (
        <>
            {" "}
            <VStack>
                <RadioGroup.Root
                    value={settings.sharing.new ?? settings.sharing.current ?? "private"}
                    onValueChange={(details: { value: string | null }) => {
                        const newSharingValue = details.value as "private" | "public" | "shared"

                        // If changing from shared to something else, clear the project list
                        const currentSharing = settings.sharing.new ?? settings.sharing.current
                        const shouldClearProjects = currentSharing === "shared" && newSharingValue !== "shared"

                        setSettings({
                            ...settings,
                            sharing: {
                                ...settings.sharing,
                                new: newSharingValue,
                            },
                            projectsSharedWith: shouldClearProjects
                                ? {
                                      ...settings.projectsSharedWith,
                                      new: [],
                                  }
                                : settings.projectsSharedWith,
                        })
                    }}
                >
                    <VStack gap={6} alignItems={"start"} w={"100%"}>
                        {[
                            {
                                selected:
                                    (settings.sharing.current === "private" && !settings.sharing.new) ||
                                    settings.sharing.new === "private",
                                value: "private",
                                text: "Private",
                                bgColor: "blue.800",
                                borderColor: "transparent",
                                textColor: "blue.100",
                                itemBackground: "contentBackground",
                                tip: "Not visible to other users or projects.",
                            },
                            {
                                selected:
                                    (settings.sharing.current === "public" && !settings.sharing.new) ||
                                    settings.sharing.new === "public",
                                value: "public",
                                text: "Public",
                                bgColor: "green.500",
                                borderColor: "transparent",
                                textColor: "white",
                                itemBackground: "contentBackground",
                                tip: "Visible to everyone.",
                            },
                            {
                                selected:
                                    (settings.sharing.current === "shared" && !settings.sharing.new) ||
                                    settings.sharing.new === "shared",
                                value: "shared",
                                text: "Shared",
                                bgColor: "teal.500",
                                borderColor: "transparent",
                                textColor: "white",
                                itemBackground: "contentBackground",
                                tip: "Shared with selected projects.",
                            },
                        ].map((option) => (
                            <HStack key={option.value} gap={4} alignItems={{ base: "start", sm: "center" }}>
                                <HStack minW={"110px"}>
                                    <CustomRadioItem option={option} />
                                </HStack>
                                <Text fontSize={"sm"} color={"textColorMuted"}>
                                    {option.tip}
                                </Text>
                            </HStack>
                        ))}
                    </VStack>
                </RadioGroup.Root>
            </VStack>
            {(settings.sharing.new === "shared" ||
                (settings.sharing.new === null && settings.sharing.current === "shared")) && (
                <HStack
                    bg={"contentBackground"}
                    borderRadius={{ base: "25px", sm: "35px" }}
                    p={4}
                    w={"100%"}
                    flexWrap={"wrap"}
                    gap={4}
                >
                    <Box w={"300px"} maxW={"100%"}>
                        <ProjectPicker
                            onProjectSelect={(project) => {
                                addProject(project)
                            }}
                            selectorText={`Select projects to share with...`}
                            placeholder={"Search..."}
                        />
                    </Box>
                    <HStack flexWrap={"wrap"} gap={3}>
                        {sharingValidationError ? (
                            <Text color={"orange.500"} pl={1} fontWeight={"bold"}>
                                {sharingValidationError}
                            </Text>
                        ) : (
                            getCurrentProjectList().map((project) => (
                                <HStack
                                    key={project.projectUrlSlug}
                                    bg={"pageBackground"}
                                    pr={2}
                                    borderRadius="full"
                                    cursor="default"
                                    h={"35px"}
                                >
                                    <Image
                                        src={
                                            !project.projectLogoUrl || project.projectLogoUrl === ""
                                                ? ASSETS.DEFAULT_PROFILE_IMAGE
                                                : project.projectLogoUrl
                                        }
                                        alt={`${project.projectDisplayName} Logo`}
                                        fit="cover"
                                        w="35px"
                                        borderRadius="full"
                                    />
                                    <Text fontWeight={"bold"}>{project.projectDisplayName}</Text>
                                    <Button
                                        secondaryButton
                                        borderRadius="full"
                                        p={0}
                                        minW="auto"
                                        h="20px"
                                        onClick={() => removeProject(project.projectUrlSlug)}
                                    >
                                        <FontAwesomeIcon icon={faXmark} />
                                    </Button>
                                </HStack>
                            ))
                        )}
                    </HStack>
                </HStack>
            )}
        </>
    )
}

export default SharingRadioGroup
