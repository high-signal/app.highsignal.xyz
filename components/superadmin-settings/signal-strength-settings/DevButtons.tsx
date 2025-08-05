"use client"

import { Button, HStack, Text } from "@chakra-ui/react"
import { getAccessToken } from "@privy-io/react-auth"

interface DevButtonProps {
    label: string
    functionType?: string
    method?: "POST" | "PATCH"
    body?: any
    disabled?: boolean
}

function DevButton({ label, functionType, method = "POST", body, disabled = false }: DevButtonProps) {
    const handleClick = async () => {
        try {
            const token = await getAccessToken()
            const url = functionType
                ? `/api/superadmin/accounts/trigger-update?functionType=${functionType}`
                : `/api/superadmin/accounts/trigger-update`

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                ...(body && { body: JSON.stringify(body) }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                console.error(errorData.error)
            }
        } catch (error) {
            console.error("Error executing dev button action:", error)
        }
    }

    return (
        <Button primaryButton px={2} py={1} borderRadius={"full"} disabled={disabled} onClick={handleClick}>
            {label}
        </Button>
    )
}

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
    const isSingleItemDisabled = !selectedUser || !project || !signalStrengthUsername

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
            <DevButton label="addAllItemsToAiQueue" functionType="addAllItemsToAiQueue" />
            <DevButton
                label="addSingleItemToAiQueue"
                method="PATCH"
                body={{
                    signalStrengthName: signalStrength.name,
                    userId: selectedUser?.id,
                    projectId: project?.id,
                    signalStrengthUsername: signalStrengthUsername,
                }}
                disabled={isSingleItemDisabled}
            />
            <DevButton label="runAiGovernor" functionType="runAiGovernor" />
            <DevButton label="addAllItemsToForumQueue" functionType="addAllItemsToForumQueue" />
            <DevButton label="runForumGovernor" functionType="runForumGovernor" />
            <DevButton label="runDiscordGovernor" functionType="runDiscordGovernor" />
        </HStack>
    )
}
