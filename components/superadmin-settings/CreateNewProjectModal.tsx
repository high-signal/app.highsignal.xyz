"use client"

import { useState } from "react"
import EditorModal from "../ui/EditorModal"
import { Text, VStack } from "@chakra-ui/react"
import { usePrivy } from "@privy-io/react-auth"
import { useRouter } from "next/navigation"

export default function CreateNewProjectModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { getAccessToken } = usePrivy()
    const router = useRouter()

    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSave = async () => {
        setIsSaving(true)
        const token = await getAccessToken()
        const response = await fetch("/api/settings/superadmin/projects", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        const responseData = await response.json()

        if (!response.ok) {
            setError(responseData.error)
            setIsSaving(false)
            return
        } else {
            router.push(`/settings/p/${responseData.project.url_slug}`)
        }
    }

    return (
        <EditorModal
            isOpen={isOpen}
            handleClose={() => {
                setError(null)
                onClose()
            }}
            hasChanges={false}
            title="Create New Project"
            handleSave={handleSave}
            saveButtonText="Create new project"
            maxWidth={"800px"}
            isSaving={isSaving}
        >
            <VStack alignItems="start" fontSize="md">
                <Text>This will create a new project with a random UUID as the name.</Text>
                <Text>
                    After clicking &quot;Create new project&quot;, you will be redirected to the project settings page.
                </Text>
                <Text>There you will need to edit the project settings to set the name, logo, and URL slug.</Text>
            </VStack>
            {error && (
                <Text fontSize="md" w={"100%"} textAlign="end" color="red.500">
                    {error}
                </Text>
            )}
        </EditorModal>
    )
}
