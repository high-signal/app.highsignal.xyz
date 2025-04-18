"use client"

import { useState, useEffect } from "react"
import { VStack, Text } from "@chakra-ui/react"
import { useUser } from "../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"
import ContentContainer from "../layout/ContentContainer"
import { validateUsername, validateDisplayName } from "../../utils/userValidation"
import SettingsInputField from "./SettingsInputField"

export default function UserSettingsContainer() {
    const { user, refreshUser } = useUser()
    const { getAccessToken } = usePrivy()

    const [username, setUsername] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [usernameError, setUsernameError] = useState("")
    const [displayNameError, setDisplayNameError] = useState("")
    const [isUsernameChanged, setIsUsernameChanged] = useState(false)
    const [isDisplayNameChanged, setIsDisplayNameChanged] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Initialize form with user data
    useEffect(() => {
        if (user?.username || user?.isSuperAdmin === true) {
            //fetchUser()
        } else {
            //show404()
        }
    }, [user])

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

    if (!user) {
        return (
            <ContentContainer>
                <VStack>
                    <Text>Loading user data...</Text>
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
