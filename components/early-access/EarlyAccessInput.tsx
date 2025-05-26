"use client"

import { VStack, Button, Text, HStack, Box, Spinner, Image, Flex } from "@chakra-ui/react"
import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"

import { useEarlyAccess } from "../../contexts/EarlyAccessContext"
import { usePrivy } from "@privy-io/react-auth"
import { useUser } from "../../contexts/UserContext"
import { ASSETS } from "../../config/constants"

import SingleLineTextInput from "../ui/SingleLineTextInput"

export default function EarlyAccessInput() {
    const searchParams = useSearchParams()

    const [code, setCode] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isButtonLoading, setIsButtonLoading] = useState(false)
    const { setHasAccess } = useEarlyAccess()
    const { setTriggerUserCreation } = useUser()
    const { login, logout, authenticated, ready: privyReady } = usePrivy()

    const handleSubmit = useCallback(
        async (code: string) => {
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
        },
        [setHasAccess, setTriggerUserCreation],
    )

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault()
            handleSubmit(code)
        }
    }

    // Check url params for early access code
    useEffect(() => {
        const earlyAccessCode = searchParams.get("earlyAccessCode")
        if (earlyAccessCode && earlyAccessCode !== "") {
            setCode(earlyAccessCode)
            handleSubmit(earlyAccessCode)
        }
    }, [searchParams, handleSubmit])

    useEffect(() => {
        setIsButtonLoading(false)
    }, [authenticated])

    return (
        <VStack gap={0} w="100%" pt={50} justifyContent="center" alignItems="center" position="relative" zIndex={1}>
            <VStack gap={1} justifyContent={"center"} alignItems={"center"} cursor={"default"} transform="scale(1.4)">
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
            </VStack>
            <VStack gap={6} w="90%" maxW="300px" px={6} transform="scale(1.1)" mt={3}>
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        handleSubmit(code)
                    }}
                    style={{ width: "100%" }}
                >
                    <VStack gap={2} h={"100%"} justifyContent="start">
                        {error ? (
                            <Text color="orange.500" h={"24px"} pt={3}>
                                {error}
                            </Text>
                        ) : (
                            <Box h={"24px"} bg={"green.500"}></Box>
                        )}
                        <Box pt={2} w="100%">
                            <SingleLineTextInput
                                placeholder="Enter access code"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toLowerCase())}
                                onKeyDown={handleKeyDown}
                            />
                        </Box>
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
                    <Flex
                        mt={5}
                        gap={authenticated ? 1 : 2}
                        pt={authenticated ? 3 : 0}
                        flexWrap={"wrap"}
                        flexDirection={{ base: "column", md: authenticated ? "row" : "column" }}
                        justifyContent={"center"}
                        alignItems={"center"}
                        transform="scale(1.1)"
                    >
                        {authenticated && <Text>Please enter an access code</Text>}
                        <Text>or</Text>
                        <Box mt={{ base: 1, md: 0 }} ml={{ base: 0, md: 1 }}>
                            <Button
                                primaryButton
                                borderRadius="full"
                                overflow="hidden"
                                justifyContent="center"
                                h="35px"
                                w="fit-content"
                                px={3}
                                onClick={() => {
                                    if (authenticated) {
                                        setIsButtonLoading(true)
                                        logout()
                                    } else {
                                        login()
                                    }
                                }}
                                loading={isButtonLoading}
                            >
                                <Text fontWeight={"bold"}>{authenticated ? "Log out" : "Log in"}</Text>
                            </Button>
                        </Box>
                    </Flex>
                </>
            ) : (
                <Spinner />
            )}
        </VStack>
    )
}
