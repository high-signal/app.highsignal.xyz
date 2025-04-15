"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Button,
    Input,
    VStack,
    Text,
} from "@chakra-ui/react"
import { usePrivy } from "@privy-io/react-auth"
import { useUser } from "../../contexts/UserContext"

interface SignUpDialogProps {
    isOpen: boolean
    onClose: () => void
}

export default function SignUpDialog({ isOpen, onClose }: SignUpDialogProps) {
    const { user: privyUser } = usePrivy()
    const { refreshUser } = useUser()
    const [username, setUsername] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!privyUser) {
            setError("You must be authenticated with Privy to create an account")
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch("/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    privy_id: privyUser.id,
                    username,
                    display_name: displayName,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to create account")
            }

            // Refresh user data
            await refreshUser()

            // Close dialog
            onClose()
        } catch (err) {
            console.error("Error creating account:", err)
            setError(err instanceof Error ? err.message : "An unknown error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Content>
                <Dialog.Header>
                    <Dialog.Title>Create Your Account</Dialog.Title>
                    <Dialog.Description>Complete your profile to get started</Dialog.Description>
                </Dialog.Header>

                <form onSubmit={handleSubmit}>
                    <VStack gap={4} align="stretch">
                        <div>
                            <label htmlFor="username">Username</label>
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Choose a username"
                                pattern="[a-zA-Z0-9_-]+"
                                title="Username can only contain letters, numbers, underscores, and hyphens"
                                required
                                aria-invalid={!!error}
                                aria-describedby={error ? "username-error" : undefined}
                            />
                            {error && (
                                <div
                                    id="username-error"
                                    style={{ color: "red", fontSize: "0.875rem", marginTop: "0.25rem" }}
                                >
                                    {error}
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="displayName">Display Name</label>
                            <Input
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your display name"
                                required
                            />
                        </div>

                        <Text fontSize="sm" color="gray.500">
                            Your username will be used in your profile URL and cannot be changed later.
                        </Text>
                    </VStack>

                    <Dialog.Footer mt={6}>
                        <Button variant="outline" onClick={onClose} mr={3}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={isLoading}>
                            Create Account
                        </Button>
                    </Dialog.Footer>
                </form>
            </Dialog.Content>
        </Dialog.Root>
    )
}
