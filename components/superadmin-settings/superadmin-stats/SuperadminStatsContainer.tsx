"use client"

import { useState, useEffect } from "react"
import { HStack, Spinner, Text, VStack, Box, Grid, GridItem, useToken } from "@chakra-ui/react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

import SettingsSectionContainer from "../../ui/SettingsSectionContainer"
import { usePrivy } from "@privy-io/react-auth"

interface ChartConfig {
    title: string
    dataKey: string
    colors: string[]
    getCategories: (data: any[]) => string[]
    getData: (data: any[]) => any[]
    formatYAxis?: (value: number) => string
}

interface LambdaStatsDaily {
    day: string
    function_type: string
    invocation_count: number
    total_action_count: number
    total_billed_duration: number
}

interface AiStatsDaily {
    day: string
    score_type: string
    record_count: number
    total_tokens: number
}

interface StatsData {
    lambdaStatsDaily: LambdaStatsDaily[]
    aiStatsDaily: AiStatsDaily[]
}

interface StatsChartProps {
    title: string
    data: any[]
    config: ChartConfig
}

// Format numbers for Y-axis display
function formatNumber(value: number): string {
    if (value < 1000) {
        return value.toString()
    } else if (value < 1000000) {
        const k = value / 1000
        return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`
    } else {
        const m = value / 1000000
        return m % 1 === 0 ? `${m}m` : `${m.toFixed(1)}m`
    }
}

function StatsChart({ title, data, config }: StatsChartProps) {
    const chartData = config.getData(data)
    const categories = config.getCategories(data)

    return (
        <Box p={4} bg="contentBackground" borderRadius={{ base: "0px", sm: "16px" }}>
            <Text fontSize="lg" fontWeight="semibold" mb={4} w="100%" textAlign="center">
                {title}
            </Text>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                    <XAxis dataKey="day" />
                    <YAxis tickFormatter={config.formatYAxis} />
                    <Tooltip />
                    <Legend />
                    {categories.map((category, index) => (
                        <Bar key={category} dataKey={category} fill={config.colors[index % config.colors.length]} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </Box>
    )
}

export default function SuperadminStatsContainer() {
    const { getAccessToken } = usePrivy()

    const [stats, setStats] = useState<StatsData | null>(null)
    const [isStatsLoading, setIsStatsLoading] = useState(true)
    const [statsError, setStatsError] = useState<string | null>(null)

    useEffect(() => {
        const fetchStats = async () => {
            const token = await getAccessToken()
            const response = await fetch("/api/settings/superadmin/stats-history", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            const data = await response.json()

            if (data.status === "success") {
                setStats(data.data)
                setStatsError(null)
            } else {
                console.error(data.error)
                setStatsError("Error fetching stats: " + data.error)
            }
            setIsStatsLoading(false)
        }
        fetchStats()
    }, [getAccessToken])

    // Get theme colors using useToken hook
    const [green500, teal500, gold500, red400, pink500, purple500, orange500] = useToken("colors", [
        "green.500",
        "teal.500",
        "gold.500",
        "red.400",
        "pink.500",
        "purple.500",
        "orange.500",
    ])

    const aiColors = [green500, teal500]
    const lambdaColors = [green500, teal500, pink500, gold500, purple500, red400, orange500]

    // Chart configurations
    const chartConfigs: ChartConfig[] = [
        {
            title: "AI Stats - Invocation Count",
            dataKey: "record_count",
            colors: aiColors,
            getCategories: (data) => Array.from(new Set(data.map((item: AiStatsDaily) => item.score_type))),
            getData: (data) => {
                const dayGroups: { [key: string]: any } = {}
                data.forEach((item: AiStatsDaily) => {
                    if (!dayGroups[item.day]) {
                        dayGroups[item.day] = { day: item.day }
                    }
                    dayGroups[item.day][item.score_type] = item.record_count
                })
                return Object.values(dayGroups)
            },
        },
        {
            title: "AI Stats - Tokens Used",
            dataKey: "total_tokens",
            colors: aiColors,
            formatYAxis: formatNumber,
            getCategories: (data) => Array.from(new Set(data.map((item: AiStatsDaily) => item.score_type))),
            getData: (data) => {
                const dayGroups: { [key: string]: any } = {}
                data.forEach((item: AiStatsDaily) => {
                    if (!dayGroups[item.day]) {
                        dayGroups[item.day] = { day: item.day }
                    }
                    dayGroups[item.day][item.score_type] = item.total_tokens
                })
                return Object.values(dayGroups)
            },
        },
        {
            title: "Lambda Stats - Invocation Count",
            dataKey: "invocation_count",
            colors: lambdaColors,
            getCategories: (data) => Array.from(new Set(data.map((item: LambdaStatsDaily) => item.function_type))),
            getData: (data) => {
                const dayGroups: { [key: string]: any } = {}
                data.forEach((item: LambdaStatsDaily) => {
                    if (!dayGroups[item.day]) {
                        dayGroups[item.day] = { day: item.day }
                    }
                    dayGroups[item.day][item.function_type] = item.invocation_count
                })
                return Object.values(dayGroups)
            },
        },
        {
            title: "Lambda Stats - Total Billed Duration",
            dataKey: "total_billed_duration",
            colors: lambdaColors,
            getCategories: (data) => Array.from(new Set(data.map((item: LambdaStatsDaily) => item.function_type))),
            getData: (data) => {
                const dayGroups: { [key: string]: any } = {}
                data.forEach((item: LambdaStatsDaily) => {
                    if (!dayGroups[item.day]) {
                        dayGroups[item.day] = { day: item.day }
                    }
                    // Convert milliseconds to seconds with 1 decimal place
                    dayGroups[item.day][item.function_type] = Math.round((item.total_billed_duration / 1000) * 10) / 10
                })
                return Object.values(dayGroups)
            },
        },
    ]

    return (
        <SettingsSectionContainer maxWidth="100%">
            {statsError ? (
                <Text color="orange.500">{statsError}</Text>
            ) : isStatsLoading ? (
                <HStack justify="center" py={8}>
                    <Spinner />
                    <Text>Loading stats...</Text>
                </HStack>
            ) : (
                <VStack gap={8} w={"100%"}>
                    <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6} w={"100%"}>
                        <GridItem>
                            <StatsChart
                                title={chartConfigs[0].title}
                                data={stats?.aiStatsDaily || []}
                                config={chartConfigs[0]}
                            />
                        </GridItem>
                        <GridItem>
                            <StatsChart
                                title={chartConfigs[1].title}
                                data={stats?.aiStatsDaily || []}
                                config={chartConfigs[1]}
                            />
                        </GridItem>
                        <GridItem>
                            <StatsChart
                                title={chartConfigs[2].title}
                                data={stats?.lambdaStatsDaily || []}
                                config={chartConfigs[2]}
                            />
                        </GridItem>
                        <GridItem>
                            <StatsChart
                                title={chartConfigs[3].title}
                                data={stats?.lambdaStatsDaily || []}
                                config={chartConfigs[3]}
                            />
                        </GridItem>
                    </Grid>
                </VStack>
            )}
        </SettingsSectionContainer>
    )
}
