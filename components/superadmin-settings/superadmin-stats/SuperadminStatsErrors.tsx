"use client"

import { Text, Spinner, VStack, HStack } from "@chakra-ui/react"

import { useEffect, useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { useThemeColor } from "../../../utils/theme-utils/getThemeColor"

interface StatsData {
    missingDays: number
    aiRawScoreErrors: number
    lastCheckedNotNull: number
    discordRequestQueueErrors: number
}

export default function SuperadminStatsErrors() {
    const { getAccessToken } = usePrivy()

    // Get overview and error stats from the database
    const [errorStats, setErrorStats] = useState<StatsData | null>(null)
    const [isErrorStatsLoading, setIsErrorStatsLoading] = useState(true)
    const [errorStatsError, setErrorStatsError] = useState<string | null>(null)

    useEffect(() => {
        const fetchStats = async () => {
            const token = await getAccessToken()
            const response = await fetch("/api/settings/superadmin/stats-errors", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            const data = await response.json()

            if (data.status === "success") {
                setErrorStats(data.data)
                setErrorStatsError(null)
            } else {
                console.error(data.error)
                setErrorStatsError("Error fetching stats: " + data.error)
            }
            setIsErrorStatsLoading(false)
        }
        fetchStats()
    }, [getAccessToken])

    const StatsRow = ({ label, value }: { label: string; value: number }) => {
        const isError = value > 0

        return (
            <HStack
                bg={"contentBackground"}
                gap={3}
                pl={3}
                pr={isErrorStatsLoading ? 3 : 4}
                py={"2px"}
                borderRadius={"16px"}
                border={isError ? "5px solid" : "none"}
                borderColor={isError ? "red.500" : "contentBorder"}
                fontWeight={isError ? "bold" : "normal"}
                color={isError ? "red.500" : "textColorMuted"}
            >
                <Text>{label}:</Text>
                {isErrorStatsLoading ? <Spinner size="xs" /> : <Text>{isError ? value : "-"}</Text>}
            </HStack>
        )
    }
    return (
        <VStack alignItems="start" w={"100%"} bg={"pageBackground"}>
            <HStack
                alignItems="center"
                justifyContent={"start"}
                w={"100%"}
                color={"textColorMuted"}
                fontSize={"sm"}
                columnGap={3}
                rowGap={0}
                px={3}
                borderRadius={{ base: "0px", sm: "16px" }}
                border="2px solid"
                borderX={{ base: "0px solid", sm: `2px solid ${useThemeColor("contentBorder")}` }}
                borderColor="contentBorder"
                pt={{ base: 0, sm: "3px" }}
                pb={{ base: 2, sm: "3px" }}
                flexWrap={"wrap"}
            >
                {errorStatsError ? (
                    <Text color="red.500">{errorStatsError}</Text>
                ) : (
                    <>
                        <Text
                            fontSize="lg"
                            fontWeight="bold"
                            color={
                                errorStats && Object.values(errorStats).some((value) => value > 0)
                                    ? "red.500"
                                    : "textColorMuted"
                            }
                            // color={"textColorMuted"}
                            ml={{ base: 1, sm: 0 }}
                        >
                            Errors
                        </Text>
                        <HStack columnGap={3} rowGap={1} flexWrap={"wrap"}>
                            <StatsRow label="Missing Days" value={errorStats?.missingDays ?? 0} />
                            <StatsRow label="AI Raw Score Errors" value={errorStats?.aiRawScoreErrors ?? 0} />
                            <StatsRow label="Last Checked Not Null" value={errorStats?.lastCheckedNotNull ?? 0} />
                            <StatsRow
                                label="Discord Request Queue Errors"
                                value={errorStats?.discordRequestQueueErrors ?? 0}
                                // value={0}
                            />
                        </HStack>
                    </>
                )}
            </HStack>
        </VStack>
    )
}
