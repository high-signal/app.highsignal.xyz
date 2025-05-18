"use client"

import { VStack, Image, Button, Text, Box, HStack } from "@chakra-ui/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import SingleLineTextInput from "../ui/SingleLineTextInput"
import { ASSETS } from "../../config/constants"

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
        <VStack w="100%" pt={50} justifyContent="center" alignItems="center">
            <VStack gap={6} w="90%" maxW="300px" p={6}>
                <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                    <VStack gap={4} transform="scale(1.2)" h={"100%"} minH={"300px"} justifyContent="start">
                        <Box mb={5}>
                            <HStack gap={2} justifyContent={"center"} alignItems={"center"}>
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
                        </Box>
                        <SingleLineTextInput
                            placeholder="Enter access code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toLowerCase())}
                            onKeyDown={handleKeyDown}
                        />
                        <Button primaryButton borderRadius="full" h={"30px"} w="100%" fontSize={"md"} type="submit">
                            Submit
                        </Button>
                        {error && <Text color="red.400">{error}</Text>}
                    </VStack>
                </form>
            </VStack>
        </VStack>
    )
}
