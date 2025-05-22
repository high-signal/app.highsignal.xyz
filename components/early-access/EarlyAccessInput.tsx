"use client"

import { VStack, Button, Text, HStack, Box, Spinner, Image } from "@chakra-ui/react"
import { useState } from "react"
import SingleLineTextInput from "../ui/SingleLineTextInput"
import { useEarlyAccess } from "../../contexts/EarlyAccessContext"
import { usePrivy } from "@privy-io/react-auth"
import { useUser } from "../../contexts/UserContext"
import { ASSETS } from "../../config/constants"

export default function EarlyAccessInput() {
    const [code, setCode] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { setHasAccess } = useEarlyAccess()
    const { setTriggerUserCreation } = useUser()
    const { login, logout, authenticated, ready: privyReady } = usePrivy()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // Check access code against the database
        setIsLoading(true)
        const response = await fetch(`/api/access-code?code=${code}`, {
            method: "GET",
        })
        const data = await response.json()

        if (data.success) {
            setHasAccess(true, code)
            setTriggerUserCreation(true)
        } else {
            setError("Invalid access code")
        }
        setIsLoading(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault()
            handleSubmit(e as any)
        }
    }

    return (
        <VStack w="100%" pt={50} justifyContent="center" alignItems="center">
            <HStack gap={2} justifyContent={"center"} alignItems={"center"} cursor={"default"}>
                <Image
                    src={`${ASSETS.LOGO_BASE_URL}/w_300,h_300,c_fill,q_auto,f_webp/${ASSETS.LOGO_ID}`}
                    alt="Logo"
                    boxSize={"50px"}
                    minW={"50px"}
                    borderRadius="full"
                />
                <Text minW="80px" fontWeight="bold" fontSize="xl" whiteSpace={"nowrap"}>
                    {process.env.NEXT_PUBLIC_SITE_NAME}
                </Text>
            </HStack>
            <VStack gap={6} w="90%" maxW="300px" px={6}>
                <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                    <VStack gap={4} h={"100%"} justifyContent="start">
                        {error ? (
                            <Text color="orange.500" h={"24px"} pt={2}>
                                {error}
                            </Text>
                        ) : (
                            <Box h={"24px"} bg={"green.500"}></Box>
                        )}
                        <SingleLineTextInput
                            placeholder="Enter access code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toLowerCase())}
                            onKeyDown={handleKeyDown}
                        />
                        <Button
                            secondaryButton
                            borderRadius="full"
                            h={"35px"}
                            w="100%"
                            fontSize={"md"}
                            type="submit"
                            loading={isLoading}
                        >
                            Submit
                        </Button>
                    </VStack>
                </form>
            </VStack>
            {privyReady ? (
                <>
                    {!authenticated && <Text>or</Text>}
                    <HStack gap={2} pt={authenticated ? 3 : 0}>
                        {authenticated && <Text>Please enter an access code or</Text>}
                        <Button
                            primaryButton
                            borderRadius="full"
                            overflow="hidden"
                            justifyContent="center"
                            h="35px"
                            w="fit-content"
                            px={3}
                            onClick={authenticated ? logout : login}
                        >
                            <Text fontWeight={"bold"}>{authenticated ? "Log out" : "Log in"}</Text>
                        </Button>
                    </HStack>
                </>
            ) : (
                <Spinner />
            )}
        </VStack>
    )
}
