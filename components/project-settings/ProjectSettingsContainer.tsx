"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { VStack, Text, Button, Spinner, Menu, Portal, HStack, Box } from "@chakra-ui/react"
import { toaster } from "../ui/toaster"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEllipsisVertical, faSignOut } from "@fortawesome/free-solid-svg-icons"

import { useUser } from "../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"
import { validateUsername, validateDisplayName } from "../../utils/userValidation"

import ContentContainer from "../layout/ContentContainer"
import ImageEditor from "../ui/ImageEditor"

export default function ProjectSettingsContainer() {
    const { loggedInUser, loggedInUserLoading, refreshUser } = useUser()
    const { getAccessToken } = usePrivy()
    const params = useParams()
    const router = useRouter()

    const [project, setProject] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        urlSlug: "",
        displayName: "",
        projectLogoUrl: "",
    })
    const [errors, setErrors] = useState({
        urlSlug: "",
        displayName: "",
    })
    const [hasChanges, setHasChanges] = useState(false)
    const [forumUsername, setForumUsername] = useState("")
    const [isForumSubmitting, setIsForumSubmitting] = useState(false)
    const [hasForumChanges, setHasForumChanges] = useState(false)

    // Initialize form data
    useEffect(() => {
        const fetchUserData = async () => {
            if (!loggedInUser) {
                setIsLoading(false)
                setError("Please log in to access project settings")
                return
            }

            const urlSlug = params?.project as string
            if (!urlSlug) {
                setError("No project name provided")
                return
            }

            try {
                const token = await getAccessToken()
                const response = await fetch(`/api/settings/p?project=${urlSlug}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "x-target-project": urlSlug,
                    },
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    console.error("Failed to fetch project data:", errorData)
                    throw new Error(errorData.error || "Failed to fetch project data")
                }

                const data = await response.json()
                setProject(data)
                setFormData({
                    urlSlug: data.url_slug || "",
                    displayName: data.display_name || "",
                    projectLogoUrl: data.project_logo_url || "",
                })
                // Set the forum username from the API response
                if (data.forum_users && data.forum_users.length > 0) {
                    setForumUsername(data.forum_users[0].forum_username || "")
                    // Set hasForumChanges to false if there's a forum username
                    setHasForumChanges(false)
                } else {
                    // If there's no forum username, set hasForumChanges to true
                    setHasForumChanges(true)
                }
            } catch (err) {
                console.error("Error in fetchUserData:", err)
                setError(err instanceof Error ? err.message : "An error occurred")
            } finally {
                setIsLoading(false)
            }
        }

        if (!loggedInUserLoading) {
            fetchUserData()
        }
    }, [loggedInUser, loggedInUserLoading, params?.username, getAccessToken, router])

    const handleImageUpdated = (imageUrl: string) => {
        setFormData((prev) => ({
            ...prev,
            profileImageUrl: imageUrl,
        }))
        refreshUser()
    }

    // TODO: Style this
    if (isLoading) {
        return (
            <ContentContainer>
                <VStack gap={10} w="100%" minH="300px" justifyContent="center" alignItems="center" borderRadius="20px">
                    <Spinner size="lg" />
                </VStack>
            </ContentContainer>
        )
    }

    // TODO: Style this
    if (error) {
        return (
            <ContentContainer>
                <VStack>
                    <Text color="orange.700">{error}</Text>
                </VStack>
            </ContentContainer>
        )
    }

    // TODO: Style this
    if (!project) {
        return (
            <ContentContainer>
                <VStack>
                    <Text>Project not found</Text>
                </VStack>
            </ContentContainer>
        )
    }

    return (
        <ContentContainer>
            <VStack gap={6} w="100%" maxW="500px" mx="auto" p={4}>
                <Text fontSize="2xl" fontWeight="bold">
                    Project Settings
                </Text>
                <ImageEditor
                    currentImageUrl={project.project_logo_url}
                    onImageUploaded={handleImageUpdated}
                    targetType="project"
                    targetId={project.id}
                    targetName={project.name}
                    uploadApiPath="/api/settings/p/project-image"
                />
                {/* <SettingsInputField
                    label="Username"
                    description="Your username is unique and is used to identify you."
                    isPrivate={false}
                    value={formData.username}
                    onChange={(e) => handleFieldChange("username", e.target.value)}
                    error={errors.username}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && hasChanges && !isSubmitting) {
                            saveChanges()
                        }
                    }}
                />
                <Button
                    colorScheme="blue"
                    onClick={saveChanges}
                    loading={isSubmitting}
                    disabled={!hasChanges || isSubmitting}
                    w="100%"
                    borderRadius="full"
                >
                    Save Changes
                </Button> */}
            </VStack>
        </ContentContainer>
    )
}
