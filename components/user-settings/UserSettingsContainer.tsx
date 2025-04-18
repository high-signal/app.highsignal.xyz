"use client"

import { useState, useEffect } from "react"
import { VStack, Text } from "@chakra-ui/react"
import { useUser } from "../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"
import ContentContainer from "../layout/ContentContainer"
import { validateUsername, validateDisplayName } from "../../utils/userValidation"
import SettingsInputField from "./SettingsInputField"
import { useParams, useRouter } from "next/navigation"

export default function UserSettingsContainer() {
    const { user, refreshUser } = useUser()
    const { getAccessToken } = usePrivy()
    const params = useParams()
    const router = useRouter()
    const [targetUser, setTargetUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [username, setUsername] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [usernameError, setUsernameError] = useState("")
    const [displayNameError, setDisplayNameError] = useState("")
    const [isUsernameChanged, setIsUsernameChanged] = useState(false)
    const [isDisplayNameChanged, setIsDisplayNameChanged] = useState(false)

    // Initialize form with user data
    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return

            const username = params?.username as string
            if (!username) return

            try {
                const token = await getAccessToken()
                const response = await fetch(`/api/settings/u`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ username }),
                })

                if (!response.ok) {
                    throw new Error("Failed to fetch user data")
                }

                const data = await response.json()
                console.log("data", data)
                setTargetUser(data)
                setUsername(data.username || "")
                setDisplayName(data.display_name || "")
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred")
            } finally {
                setIsLoading(false)
            }
        }

        fetchUserData()
    }, [user, params?.username, getAccessToken, router])

    // Handle username change
    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setUsername(newValue)
        setUsernameError(validateUsername(newValue))
        setIsUsernameChanged(newValue !== user?.username)
    }

    // Handle display name change
    const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setDisplayName(newValue)
        setDisplayNameError(validateDisplayName(newValue))
        setIsDisplayNameChanged(newValue !== user?.displayName)
    }

    // Generic save function for updating user fields
    const saveField = async (
        fieldName: string,
        value: string,
        error: string,
        setChanged: (changed: boolean) => void,
    ) => {
        if (error) return

        setIsLoading(true)
        try {
            const token = await getAccessToken()
            const response = await fetch("/api/users", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    [fieldName]: value,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || `Failed to update ${fieldName}`)
            }

            await refreshUser()
            setChanged(false)
            // Show success message
            alert(`${fieldName === "username" ? "Username" : "Display name"} updated successfully`)
        } catch (error) {
            console.error(`Error updating ${fieldName}:`, error)
            // Show error message
            alert(error instanceof Error ? error.message : "An unknown error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    // Save username
    const saveUsername = () => {
        saveField("username", username, usernameError, setIsUsernameChanged)
    }

    // Save display name
    const saveDisplayName = () => {
        saveField("displayName", displayName, displayNameError, setIsDisplayNameChanged)
    }

    if (isLoading) {
        return (
            <ContentContainer>
                <VStack>
                    <Text>Loading user data...</Text>
                </VStack>
            </ContentContainer>
        )
    }

    // TODO: Style this
    if (error) {
        return (
            <ContentContainer>
                <VStack>
                    <Text color="red.500">{error}</Text>
                </VStack>
            </ContentContainer>
        )
    }

    // TODO: Style this
    if (!targetUser) {
        return (
            <ContentContainer>
                <VStack>
                    <Text>User not found</Text>
                </VStack>
            </ContentContainer>
        )
    }

    return (
        <ContentContainer>
            <VStack gap={6} w="100%" maxW="600px" mx="auto" p={4}>
                <Text fontSize="2xl" fontWeight="bold">
                    User Settings
                </Text>

                <SettingsInputField
                    label="Username"
                    description="This is your username. It will be used to identify you in the community."
                    value={username}
                    onChange={handleUsernameChange}
                    onSave={saveUsername}
                    error={usernameError}
                    isChanged={isUsernameChanged}
                    isLoading={isLoading}
                />

                <SettingsInputField
                    label="Display Name"
                    description="This is your display name. It will be used to identify you in the community."
                    value={displayName}
                    onChange={handleDisplayNameChange}
                    onSave={saveDisplayName}
                    error={displayNameError}
                    isChanged={isDisplayNameChanged}
                    isLoading={isLoading}
                />
            </VStack>
        </ContentContainer>
    )
}
