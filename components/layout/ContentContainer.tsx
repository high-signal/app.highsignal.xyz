"use client"

import { VStack, Box, Spinner } from "@chakra-ui/react"
import { ReactNode, useEffect, useState } from "react"
import { getStoredEarlyAccessCode, checkEarlyAccess } from "../../utils/earlyAccess"

import Header from "../layout/Header"
import Footer from "./Footer"
import EarlyAccessInput from "../early-access/EarlyAccessInput"

interface ContentContainerProps {
    children: ReactNode
}

export default function ContentContainer({ children }: ContentContainerProps) {
    // ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ Early Access Code ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
    const [isEarlyAccessCodeAuthorized, setIsEarlyAccessCodeAuthorized] = useState<boolean>(false)
    const [isEarlyAccessCodeLoading, setIsEarlyAccessCodeLoading] = useState<boolean>(true)

    useEffect(() => {
        const validateStoredCode = async () => {
            const storedCode = getStoredEarlyAccessCode()
            if (!storedCode) {
                setIsEarlyAccessCodeAuthorized(false)
                setIsEarlyAccessCodeLoading(false)
                return
            }

            const isValid = await checkEarlyAccess(storedCode)
            setIsEarlyAccessCodeAuthorized(isValid)
            setIsEarlyAccessCodeLoading(false)
        }

        validateStoredCode()
    }, [])

    const handleEarlyAccessSuccess = () => {
        setIsEarlyAccessCodeAuthorized(true)
    }

    if (isEarlyAccessCodeLoading || !isEarlyAccessCodeAuthorized) {
        return (
            <VStack minH="100dvh" gap={0} overflow={"hidden"}>
                <VStack
                    alignItems={"center"}
                    justifyContent={"center"}
                    gap={5}
                    w={"100%"}
                    maxW="1400px"
                    pt={{ base: 0, sm: 5 }}
                >
                    {isEarlyAccessCodeLoading ? <Spinner /> : <EarlyAccessInput onSuccess={handleEarlyAccessSuccess} />}
                </VStack>
                <Box flexGrow={1} minH={"100px"} />
                <Footer />
            </VStack>
        )
    }
    // ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑ Early Access Code ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑

    return (
        <VStack minH="100dvh" gap={0} overflow={"hidden"}>
            <Header />
            {/* <Text fontWeight="bold" textAlign="center" py={0} px={2} bg={"pink.800"} w={"100%"} mt={2}>
                Alpha Testing - Demo Data
            </Text> */}
            <VStack
                alignItems={"center"}
                justifyContent={"center"}
                gap={5}
                w={"100%"}
                maxW="1400px"
                pt={{ base: 0, sm: 5 }}
            >
                {children}
            </VStack>
            <Box flexGrow={1} minH={"100px"} />
            <Footer />
        </VStack>
    )
}
