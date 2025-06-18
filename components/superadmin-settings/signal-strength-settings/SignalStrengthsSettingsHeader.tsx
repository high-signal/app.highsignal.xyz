"use client"

import { HStack, VStack, Text, Button, Image } from "@chakra-ui/react"
import { getAccessToken } from "@privy-io/react-auth"
import { ASSETS } from "../../../config/constants"
import { useSearchParams } from "next/navigation"

export default function SignalStrengthsSettingsHeader({
    signalStrength,
    project,
    selectedUser,
    signalStrengthUsername,
}: {
    project: ProjectData | null
    selectedUser: UserData | null
    signalStrength: SignalStrengthData
    signalStrengthUsername: string
}) {
    const params = useSearchParams()
    const dev = params.get("dev") === "true"

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
            <HStack flexWrap={"wrap"} gap={4} justifyContent={"space-between"} w="100%" minH={"46px"}>
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
                    {project && dev && (
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
                                        userId: null,
                                        projectId: project?.id,
                                        signalStrengthUsername: null,
                                    }),
                                })

                                if (!response.ok) {
                                    const errorData = await response.json()
                                    console.error(errorData.error)
                                }
                            }}
                        >
                            Refresh all users
                        </Button>
                    )}
                </HStack>
                {project &&
                    (() => {
                        const projectSignalStrength = project?.signalStrengths?.find(
                            (data) => data.name === signalStrength.name,
                        )
                        return (
                            <HStack
                                gap={{ base: 0, sm: 3 }}
                                flexWrap={"wrap"}
                                justifyContent={"center"}
                                borderRadius={{ base: "16px", md: "full" }}
                                border={"3px solid"}
                                borderColor={"contentBorder"}
                                px={1}
                                pb={{ base: 2, sm: 0 }}
                            >
                                <HStack
                                    borderRight={{ base: "none", lg: "3px solid" }}
                                    borderColor={{ base: "transparent", lg: "contentBorder" }}
                                    pr={{ base: 0, sm: 4 }}
                                    py={{ base: 2, sm: 1 }}
                                >
                                    <Image
                                        src={
                                            !project.projectLogoUrl || project.projectLogoUrl === ""
                                                ? ASSETS.DEFAULT_PROFILE_IMAGE
                                                : project.projectLogoUrl
                                        }
                                        alt={`${project.displayName} Logo`}
                                        fit="cover"
                                        transition="transform 0.2s ease-in-out"
                                        w="30px"
                                        borderRadius="full"
                                    />
                                    <Text fontWeight={"bold"} w={"100%"}>
                                        {project.displayName}
                                    </Text>
                                </HStack>
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
                            </HStack>
                        )
                    })()}
            </HStack>
            {selectedUser && dev && (
                <HStack maxW={"100%"} justifyContent={"center"} flexWrap={"wrap"} gap={3} minH={"35px"}>
                    <>
                        <Text textAlign={"center"}>
                            Manually trigger/refresh user analysis for {selectedUser.username}
                        </Text>
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
                            Trigger
                        </Button>
                    </>
                </HStack>
            )}
        </VStack>
    )
}
