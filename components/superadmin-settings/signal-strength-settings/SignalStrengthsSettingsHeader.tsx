"use client"

import { HStack, VStack, Text, Button } from "@chakra-ui/react"
import { getAccessToken } from "@privy-io/react-auth"

export default function SignalStrengthsSettingsHeader({
    project,
    selectedUser,
    signalStrength,
}: {
    project: ProjectData | null
    selectedUser: UserData | null
    signalStrength: SignalStrengthData
}) {
    const signalStrengthUsername =
        selectedUser?.connectedAccounts
            ?.find((accountType) => accountType.name === signalStrength.name)
            ?.data?.find((forumUser) => Number(forumUser.projectId) === Number(project?.id))?.forumUsername || ""

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
            <HStack flexWrap={"wrap"} gap={4} justifyContent={"space-between"} w="100%">
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
                            signalStrength.status === "active"
                                ? "lozenge.background.active"
                                : "lozenge.background.disabled"
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
                {(() => {
                    const projectSignalStrength = project?.signalStrengths?.find(
                        (data) => data.name === signalStrength.name,
                    )
                    return (
                        <HStack gap={{ base: 0, sm: 10 }}>
                            {(() => {
                                const data = [
                                    {
                                        label: "Status",
                                        value: projectSignalStrength?.enabled ? "Enabled" : "Disabled",
                                    },
                                    {
                                        label: "Max Value",
                                        value: projectSignalStrength?.maxValue,
                                    },
                                    {
                                        label: "Previous Days",
                                        value: projectSignalStrength?.previousDays,
                                    },
                                ]
                                return data.map((item) => (
                                    <HStack
                                        key={item.label}
                                        flexWrap={"wrap"}
                                        gap={{ base: 1, sm: 2 }}
                                        alignItems={"center"}
                                        justifyContent={"center"}
                                        textAlign={"center"}
                                    >
                                        <Text>{item.label} </Text>
                                        <Text
                                            fontWeight={"bold"}
                                            bg={"pageBackground"}
                                            px={3}
                                            py={1}
                                            borderRadius={"full"}
                                            fontFamily={"monospace"}
                                            fontSize={"md"}
                                        >
                                            {item.value}
                                        </Text>
                                    </HStack>
                                ))
                            })()}
                        </HStack>
                    )
                })()}
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
                    <Text fontWeight={"bold"} color={signalStrengthUsername ? "inherit" : "textColorMuted"}>
                        {selectedUser && signalStrengthUsername
                            ? signalStrengthUsername
                            : selectedUser && !signalStrengthUsername
                              ? "Not connected"
                              : "Select a user"}
                    </Text>
                </HStack>
            </HStack>
            {selectedUser && (
                <HStack maxW={"100%"} justifyContent={"center"} flexWrap={"wrap"} gap={3} minH={"35px"}>
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
                                        signalStrengthUsername: signalStrengthUsername,
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
                </HStack>
            )}
        </VStack>
    )
}
