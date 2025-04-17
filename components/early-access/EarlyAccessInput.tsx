"use client"

import { VStack, Input, Button, Text } from "@chakra-ui/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

export default function EarlyAccessInput() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [code, setCode] = useState("")
    const [error, setError] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (code === "higher") {
            const params = new URLSearchParams(searchParams)
            params.set("earlyAccessCode", code)
            router.push(`?${params.toString()}`)
        } else {
            setError("Invalid access code")
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
            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                <VStack gap={4}>
                    <Input
                        placeholder="Enter access code"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toLowerCase())}
                        onKeyDown={handleKeyDown}
                        size="lg"
                        bg="gray.700"
                        border="none"
                        _focus={{ bg: "gray.700" }}
                    />
                    <Button size="lg" w="100%" type="submit">
                        Submit
                    </Button>
                    {error && <Text color="red.400">{error}</Text>}
                </VStack>
            </form>
        </VStack>
    )
}
