"use client"

import { VStack, Input, Button, Text } from "@chakra-ui/react"
import { useState } from "react"
import { checkEarlyAccess, setStoredEarlyAccessCode } from "../../utils/earlyAccess"

interface EarlyAccessInputProps {
    onSuccess: () => void
}

export default function EarlyAccessInput({ onSuccess }: EarlyAccessInputProps) {
    const [code, setCode] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const isValid = await checkEarlyAccess(code)

            if (isValid) {
                setStoredEarlyAccessCode(code)
                onSuccess()
            } else {
                setError("Invalid access code")
            }
        } catch (err) {
            setError("An error occurred. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault()
            handleSubmit(e as any)
        }
    }

    return (
        <VStack gap={6} w="90%" maxW="400px" p={6} mt={5}>
            <VStack gap={2}>
                <Text fontSize="2xl" fontWeight="bold">
                    High Signal
                </Text>
                <Text fontSize="sm" color="gray.500">
                    Get early access to High Signal
                </Text>
            </VStack>
            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                <VStack gap={4}>
                    <Input
                        placeholder="Enter access code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onKeyDown={handleKeyDown}
                        size="lg"
                        bg="gray.700"
                        border="none"
                        _focus={{ bg: "gray.700" }}
                        disabled={isLoading}
                    />
                    <Button size="lg" w="100%" type="submit" loading={isLoading} loadingText="Verifying...">
                        Submit
                    </Button>
                    {error && <Text color="red.400">{error}</Text>}
                </VStack>
            </form>
        </VStack>
    )
}
