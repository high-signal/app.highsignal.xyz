"use client"

import { Button, HStack, Text } from "@chakra-ui/react"
import { getAccessToken } from "@privy-io/react-auth"

export default function DevButtons({
    signalStrength,
    selectedUser,
    project,
    signalStrengthUsername,
}: {
    signalStrength: SignalStrengthData
    selectedUser: UserData | null
    project: ProjectData | null
    signalStrengthUsername: string | null
}) {
    return (
        <HStack
            gap={4}
            maxW={"100%"}
            borderRadius={{ base: "0px", sm: "16px" }}
            bg={"contentBackground"}
            py={3}
            px={{ base: 2, sm: 5 }}
            w={"fit-content"}
            alignItems={"center"}
            flexWrap={"wrap"}
        >
            <Text fontWeight={"bold"}>Dev Buttons</Text>
            <Button
                primaryButton
                px={2}
                py={1}
                borderRadius={"full"}
                onClick={async () => {
                    const token = await getAccessToken()
                    const response = await fetch(
                        `/api/superadmin/accounts/trigger-update?functionType=addAllItemsToAiQueue`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    )

                    if (!response.ok) {
                        const errorData = await response.json()
                        console.error(errorData.error)
                    }
                }}
            >
                addAllItemsToAiQueue
            </Button>
            <Button
                primaryButton
                px={2}
                py={1}
                borderRadius={"full"}
                disabled={!selectedUser || !project || !signalStrengthUsername}
                onClick={async () => {
                    if (selectedUser && project && signalStrengthUsername) {
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
                    }
                }}
            >
                addSingleItemToAiQueue
            </Button>
            <Button
                primaryButton
                px={2}
                py={1}
                borderRadius={"full"}
                onClick={async () => {
                    const token = await getAccessToken()
                    const response = await fetch(`/api/superadmin/accounts/trigger-update?functionType=runAiGovernor`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    })

                    if (!response.ok) {
                        const errorData = await response.json()
                        console.error(errorData.error)
                    }
                }}
            >
                runAiGovernor
            </Button>
        </HStack>
    )
}
