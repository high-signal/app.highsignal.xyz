"use client"

import { VStack, HStack, Button, Text } from "@chakra-ui/react"
import Link from "next/link"

import { useUser } from "../../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"

export default function LoginToSeeInsights({ projectData }: { projectData: ProjectData }) {
    const { loggedInUser } = useUser()
    const { login, authenticated } = usePrivy()

    return (
        <HStack
            position={"absolute"}
            bg={"pageBackground"}
            justifyContent={"center"}
            zIndex={1}
            px={5}
            py={3}
            borderRadius={"16px"}
            border={"3px solid"}
            borderColor={"contentBorder"}
            boxShadow={"lg"}
            flexWrap={"wrap"}
            maxW={"85%"}
        >
            {authenticated ? (
                <VStack>
                    <Text textWrap={"wrap"} textAlign={"center"}>
                        You can only view your own insights
                    </Text>
                    <Link href={`/p/${projectData.urlSlug}/${loggedInUser?.username}`}>
                        <Button secondaryButton px={3} py={1} borderRadius={"full"}>
                            <Text fontWeight={"bold"}>View your {projectData.displayName} profile</Text>
                        </Button>
                    </Link>
                </VStack>
            ) : (
                <>
                    <Text textWrap={"wrap"} textAlign={"center"}>
                        You can only view your own insights
                    </Text>
                    <Button
                        primaryButton
                        px={3}
                        py={1}
                        borderRadius={"full"}
                        onClick={() => {
                            login()
                        }}
                    >
                        <Text fontWeight={"bold"} textWrap={"wrap"}>
                            Log in or create an account
                        </Text>
                    </Button>
                </>
            )}
        </HStack>
    )
}
