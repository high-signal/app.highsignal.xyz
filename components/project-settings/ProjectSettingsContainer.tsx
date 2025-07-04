"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { VStack, Text, Spinner } from "@chakra-ui/react"

import { useUser } from "../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"

import ContentContainer from "../layout/ContentContainer"
import GeneralSettingsContainer from "./GeneralSettingsContainer"
import SignalStrengthSettingsContainer from "./SignalStrengthSettingsContainer"
import ApiKeysSettingsContainer from "./ApiKeysSettingsContainer"
import SettingsTabbedContent from "../ui/SettingsTabbedContent"

export default function ProjectSettingsContainer() {
    const { loggedInUser, loggedInUserLoading } = useUser()
    const { getAccessToken } = usePrivy()
    const params = useParams()
    const router = useRouter()

    const [project, setProject] = useState<ProjectData | null>(null)
    const [triggerProjectRefetch, setTriggerProjectRefetch] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Get project data
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
                    },
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    console.error("Failed to fetch project data:", errorData)
                    throw new Error(errorData.error || "Failed to fetch project data")
                }

                const data = await response.json()
                setProject(data[0])
            } catch (err) {
                console.error("Error in fetchUserData:", err)
                setError(err instanceof Error ? err.message : "An error occurred")
            } finally {
                setIsLoading(false)
                setTriggerProjectRefetch(false)
            }
        }

        if (!loggedInUserLoading || triggerProjectRefetch) {
            fetchUserData()
        }
    }, [loggedInUser, loggedInUserLoading, params?.project, getAccessToken, router, triggerProjectRefetch])

    if (isLoading) {
        return (
            <ContentContainer>
                <VStack gap={10} w="100%" minH="300px" justifyContent="center" alignItems="center" borderRadius="20px">
                    <Spinner size="lg" />
                </VStack>
            </ContentContainer>
        )
    }

    if (error) {
        return (
            <ContentContainer>
                <VStack>
                    <Text color="orange.700">{error}</Text>
                </VStack>
            </ContentContainer>
        )
    }

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
            <SettingsTabbedContent
                title={`${project.displayName} Settings`}
                updateUrlParam={true}
                tabs={[
                    {
                        value: "general",
                        label: "General",
                        content: <GeneralSettingsContainer project={project} />,
                    },
                    {
                        value: "signal-strengths",
                        label: "Signal Strengths",
                        content: (
                            <SignalStrengthSettingsContainer
                                project={project}
                                setTriggerProjectRefetch={setTriggerProjectRefetch}
                            />
                        ),
                    },
                    {
                        value: "api-keys",
                        label: "API Keys",
                        content: <ApiKeysSettingsContainer project={project} />,
                    },
                ]}
            />
        </ContentContainer>
    )
}
