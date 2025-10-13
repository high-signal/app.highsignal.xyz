"use client"

import { Text, Spinner, VStack, HStack, useToken } from "@chakra-ui/react"

import { useEffect, useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { useThemeColor } from "../../../utils/theme-utils/getThemeColor"

interface StatsData {
    missingDays: number
    aiRawScoreErrors: number
    lastCheckedNotNull: number
    discordRequestQueueErrors: number
    lambdaStatsNullBilledDuration: number
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

    const StatsRow = ({ label, value, minErrorValue }: { label: string; value: number; minErrorValue?: number }) => {
        const isError = value > 0 && (minErrorValue ? value >= minErrorValue : true)

        return (
            <HStack
                bg={isError ? "red.500" : "contentBackground"}
                gap={3}
                pl={2}
                pr={isError ? 3 : isErrorStatsLoading ? 3 : 3}
                py={"2px"}
                borderRadius={"16px"}
                fontWeight={isError ? "bold" : "normal"}
                color={isError ? "textColor" : "textColorMuted"}
            >
                <Text>{label}:</Text>
                {isErrorStatsLoading ? (
                    <Spinner size="xs" />
                ) : (
                    <Text bg={"contentBackground"} px={isError ? 2 : 0} borderRadius={"full"}>
                        {isError ? value : "-"}
                    </Text>
                )}
            </HStack>
        )
    }

    // Helper function to check if a stat value is an error, respecting minErrorValue thresholds
    const isStatError = (value: number, minErrorValue?: number) => {
        return value > 0 && (minErrorValue ? value >= minErrorValue : true)
    }

    // Add more stat errors here as needed
    const isAnyError =
        errorStats &&
        (isStatError(errorStats.missingDays) ||
            isStatError(errorStats.aiRawScoreErrors) ||
            isStatError(errorStats.lastCheckedNotNull) ||
            isStatError(errorStats.discordRequestQueueErrors) ||
            isStatError(errorStats.lambdaStatsNullBilledDuration, 500))

    const [red500] = useToken("colors", ["red.500"])
    const contentBorder = useThemeColor("contentBorder")

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
                borderX={{
                    base: "0px solid",
                    sm: `2px solid ${isAnyError ? red500 : contentBorder}`,
                }}
                borderColor={isAnyError ? red500 : contentBorder}
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
                            color={isAnyError ? "red.500" : "textColorMuted"}
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
                            />
                            <StatsRow
                                label="Lambda Stats Null Billed Duration"
                                value={errorStats?.lambdaStatsNullBilledDuration ?? 0}
                                minErrorValue={500}
                            />
                        </HStack>
                    </>
                )}
            </HStack>
        </VStack>
    )
}
