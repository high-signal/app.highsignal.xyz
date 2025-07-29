"use client"

import { HStack, VStack, Text, Image } from "@chakra-ui/react"
import { ASSETS } from "../../../config/constants"
import { useSearchParams } from "next/navigation"

export default function SignalStrengthsSettingsHeader({
    signalStrength,
    project,
}: {
    project: ProjectData | null
    signalStrength: SignalStrengthData
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
                <HStack gap={5} flexWrap={"wrap"} justifyContent={"space-between"} w={{ base: "100%", sm: "auto" }}>
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
        </VStack>
    )
}
