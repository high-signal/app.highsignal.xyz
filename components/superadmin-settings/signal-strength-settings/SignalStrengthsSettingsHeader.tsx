"use client"

import { HStack, VStack, Text, Button } from "@chakra-ui/react"
import { getAccessToken } from "@privy-io/react-auth"

export default function SignalStrengthsSettingsHeader({
    project,
    selectedUser,
    signalStrength,
    currentForumUsername,
}: {
    project: ProjectData | null
    selectedUser: UserData | null
    signalStrength: SignalStrengthData
    currentForumUsername: string
}) {
    return (
        <VStack
            justifyContent={"center"}
            w="100%"
            maxW={"100%"}
            bg={"contentBackground"}
            py={4}
            px={{ base: 6, sm: 8 }}
            borderTopRadius={{ base: 0, sm: "16px" }}
            flexWrap={"wrap"}
            gap={4}
        >
            <HStack gap={5} justifyContent={"space-between"} w={{ base: "100%", sm: "auto" }}>
                <Text
                    w="fit-content"
                    fontWeight="bold"
                    fontSize="lg"
                    whiteSpace="nowrap"
                    color={signalStrength.status === "dev" ? "textColorMuted" : undefined}
                >
                    {signalStrength.displayName}
                </Text>
                <HStack
                    justifyContent="center"
                    bg={
                        signalStrength.status === "active" ? "lozenge.background.active" : "lozenge.background.disabled"
                    }
                    border={"2px solid"}
                    color={signalStrength.status === "active" ? "lozenge.text.active" : "lozenge.text.disabled"}
                    borderColor={
                        signalStrength.status === "active" ? "lozenge.border.active" : "lozenge.border.disabled"
                    }
                    borderRadius={"full"}
                    px={3}
                    py={1}
                    fontWeight={"semibold"}
                    cursor={"default"}
                >
                    <Text whiteSpace="nowrap">
                        {signalStrength.status.charAt(0).toUpperCase() + signalStrength.status.slice(1)}
                    </Text>
                </HStack>
            </HStack>

            <HStack
                maxW={"100%"}
                bg={"pageBackground"}
                alignItems={"center"}
                borderRadius={"full"}
                px={4}
                py={2}
                flexWrap={"wrap"}
                gap={3}
            >
                <HStack flexWrap={"wrap"} columnGap={3} rowGap={1} justifyContent={"center"}>
                    <Text>{signalStrength.displayName.split(" ")[0]} username</Text>
                    <Text fontWeight={"bold"} color={currentForumUsername ? "inherit" : "textColorMuted"}>
                        {selectedUser && currentForumUsername
                            ? currentForumUsername
                            : selectedUser && !currentForumUsername
                              ? "Not connected"
                              : "Select a user"}
                    </Text>
                </HStack>
            </HStack>
            <HStack maxW={"100%"} justifyContent={"center"} flexWrap={"wrap"} gap={3} minH={"35px"}>
                {selectedUser && (
                    <>
                        <Text>Manually Trigger User Analysis</Text>
                        <Button
                            primaryButton
                            px={2}
                            py={1}
                            borderRadius={"full"}
                            onClick={async () => {
                                const token = await getAccessToken()
                                const response = await fetch(`/api/superadmin/accounts/trigger-update`, {
                                    method: "PATCH",
                                    headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({
                                        signalStrengthName: signalStrength.name,
                                        userId: selectedUser.id,
                                        projectId: project?.id,
                                        forumUsername: currentForumUsername,
                                    }),
                                })

                                if (!response.ok) {
                                    const errorData = await response.json()
                                    console.error(errorData.error)
                                }
                            }}
                        >
                            (Eridian ONLY - for testing)
                        </Button>
                    </>
                )}
            </HStack>
        </VStack>
    )
}
