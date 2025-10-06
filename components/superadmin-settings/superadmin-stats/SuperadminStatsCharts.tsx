"use client"

import { useState, useEffect, useMemo } from "react"
import { HStack, Spinner, Text, VStack, Box, Grid, GridItem, useToken, Flex } from "@chakra-ui/react"
import { Slider } from "@chakra-ui/react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBars } from "@fortawesome/free-solid-svg-icons"

import { useThemeColor } from "../../../utils/theme-utils/getThemeColor"

import SettingsSectionContainer from "../../ui/SettingsSectionContainer"
import { usePrivy } from "@privy-io/react-auth"

interface ChartConfig {
    title: string
    dataKey: string
    colors: string[]
    getCategories?: (data: any[]) => string[]
    getData: (data: any[]) => any[]
    formatYAxis?: (value: number) => string
}

interface TotalUsersDaily {
    day: string
    total_users: number
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
    pastDays: number
    totalUsersDaily: TotalUsersDaily[]
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

const ChartTooltip = ({ payload, label }: { payload: any[]; label: string }) => {
    if (!payload || payload.length === 0) return null

    return (
        <VStack
            alignItems={"center"}
            bg={"pageBackground"}
            borderRadius={"16px"}
            border={"4px solid"}
            borderColor={"contentBorder"}
            wrap={"wrap"}
            fontSize={"sm"}
            px={3}
            py={1}
            gap={0}
        >
            <Text fontWeight={"bold"} color={"textColorMuted"} w={"100%"}>
                {label}
            </Text>
            <VStack alignItems={"flex-start"} gap={1} pr={2} py={1}>
                {payload.map((entry, index) => (
                    <HStack key={index} gap={2} alignItems={"center"}>
                        <Box w={"12px"} h={"12px"} bg={entry.color} borderRadius={"2px"} />
                        <Text fontWeight={"bold"} color={entry.color}>
                            {entry.name}: {entry.value?.toLocaleString() || 0}
                        </Text>
                    </HStack>
                ))}
            </VStack>
        </VStack>
    )
}

function StatsLineChart({ title, data, config }: StatsChartProps) {
    const chartData = config.getData(data)
    const textColor = useThemeColor("textColor")

    // Calculate Y-axis domain based on data range
    const getYAxisDomain = () => {
        if (!chartData || chartData.length === 0) return [0, 100]

        const values = chartData.map((item) => item.user_count).filter((val) => val != null)
        if (values.length === 0) return [0, 100]

        const min = Math.min(...values)
        const max = Math.max(...values)

        return [min, max]
    }

    return (
        <Box p={4} bg="contentBackground" borderRadius={{ base: "0px", sm: "16px" }}>
            <Text fontSize="lg" fontWeight="semibold" mb={4} w="100%" textAlign="center">
                {title}
            </Text>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <Tooltip
                        content={<ChartTooltip payload={[]} label={""} />}
                        isAnimationActive={false}
                        cursor={{
                            stroke: textColor,
                            strokeWidth: 1,
                        }}
                    />
                    <XAxis dataKey="day" />
                    <YAxis tickFormatter={config.formatYAxis} domain={getYAxisDomain()} />
                    <Line
                        type="monotone"
                        dataKey="user_count"
                        stroke={config.colors[0]}
                        strokeWidth={3}
                        dot={{ fill: config.colors[0], strokeWidth: 0, r: 0 }}
                        activeDot={{ r: 6, stroke: config.colors[0], strokeWidth: 2 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </Box>
    )
}

function StatsChart({ title, data, config }: StatsChartProps) {
    const chartData = config.getData(data)
    const categories = config?.getCategories?.(data) || []

    const pageBackgroundColorHex = useThemeColor("pageBackground")

    return (
        <Box p={4} bg="contentBackground" borderRadius={{ base: "0px", sm: "16px" }}>
            <Text fontSize="lg" fontWeight="semibold" mb={4} w="100%" textAlign="center">
                {title}
            </Text>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} maxBarSize={50} barCategoryGap="10%" barGap="2%">
                    <Tooltip
                        content={<ChartTooltip payload={[]} label={""} />}
                        isAnimationActive={false}
                        cursor={{
                            fill: pageBackgroundColorHex,
                            strokeWidth: 0,
                            radius: [10, 10, 0, 0] as any,
                        }}
                    />
                    <XAxis dataKey="day" />
                    <YAxis tickFormatter={config.formatYAxis} />
                    <Legend />
                    {categories.map((category, index) => (
                        <Bar
                            key={category}
                            dataKey={category}
                            fill={config.colors[index % config.colors.length]}
                            radius={[4, 4, 0, 0]}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </Box>
    )
}

export default function SuperadminStatsCharts() {
    const { getAccessToken } = usePrivy()

    const [stats, setStats] = useState<StatsData>({
        pastDays: 0,
        totalUsersDaily: [],
        aiStatsDaily: [],
        lambdaStatsDaily: [],
    })
    const [isStatsLoading, setIsStatsLoading] = useState(true)
    const [statsError, setStatsError] = useState<string | null>(null)

    // Date range state
    const [dateRange, setDateRange] = useState<{ start: number; end: number } | null>(null)

    // Get theme colors
    const [teal500, contentBackground, pageBackground] = useToken("colors", [
        "teal.500",
        "contentBackground",
        "pageBackground",
    ])

    // Helper functions for date handling
    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    }

    // Generate 90 days of dates (today back to 90 days ago)
    const getDateRange = useMemo(() => {
        const dates = []
        const today = new Date()

        for (let i = stats.pastDays; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(today.getDate() - i)
            dates.push(date.toISOString().split("T")[0]) // Format as YYYY-MM-DD
        }

        return dates
    }, [stats])

    const sliderMax = getDateRange.length - 1
    const [sliderValues, setSliderValues] = useState([0, sliderMax])

    // Initialize slider to show last 90 days by default
    useEffect(() => {
        const defaultRange = 90
        const startIndex = Math.max(0, sliderMax - defaultRange)
        setSliderValues([startIndex, sliderMax])
    }, [sliderMax])

    const handleSliderChange = (newValues: number[]) => {
        let [firstValue, secondValue] = newValues

        if (secondValue - firstValue < 1) {
            if (sliderValues[0] === firstValue) {
                secondValue = firstValue + 1
            } else {
                firstValue = secondValue - 1
            }
        }
        setSliderValues([firstValue, secondValue])
    }

    // Filter data based on selected date range
    const filteredData = useMemo(() => {
        if (!stats || sliderValues.length !== 2) return stats

        const startDay = getDateRange[sliderValues[0]]
        const endDay = getDateRange[sliderValues[1]]

        return {
            totalUsersDaily: stats.totalUsersDaily.filter((item) => item.day >= startDay && item.day <= endDay),
            aiStatsDaily: stats.aiStatsDaily.filter((item) => item.day >= startDay && item.day <= endDay),
            lambdaStatsDaily: stats.lambdaStatsDaily.filter((item) => item.day >= startDay && item.day <= endDay),
        }
    }, [stats, sliderValues, getDateRange])

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
    const [green500, gold500, red400, pink500, purple500, orange500] = useToken("colors", [
        "green.500",
        "gold.500",
        "red.400",
        "pink.500",
        "purple.500",
        "orange.500",
    ])

    const aiColors = [green500, teal500]
    const lambdaColors = [green500, teal500, pink500, gold500, purple500, red400, orange500]

    // Create consistent date range for all charts
    const createConsistentDateRange = (startDay: string, endDay: string) => {
        const dates = []
        const start = new Date(startDay)
        const end = new Date(endDay)

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(d.toISOString().split("T")[0])
        }
        return dates
    }

    // Chart configurations
    const chartConfigs: ChartConfig[] = [
        {
            title: "Total Users",
            dataKey: "user_count",
            colors: aiColors,
            getData: (data) => {
                if (!filteredData) return []
                const startDay = getDateRange[sliderValues[0]]
                const endDay = getDateRange[sliderValues[1]]
                const consistentDates = createConsistentDateRange(startDay, endDay)

                // Create data with all dates, filling missing ones with 0
                return consistentDates.map((date) => {
                    const existingData = data.find((item) => item.day === date)
                    return {
                        day: date,
                        user_count: existingData ? existingData.user_count : 0,
                    }
                })
            },
        },
        {
            title: "AI Stats - Invocation Count",
            dataKey: "record_count",
            colors: aiColors,
            getCategories: (data) => Array.from(new Set(data.map((item: AiStatsDaily) => item.score_type))),
            getData: (data) => {
                if (!filteredData) return []
                const startDay = getDateRange[sliderValues[0]]
                const endDay = getDateRange[sliderValues[1]]
                const consistentDates = createConsistentDateRange(startDay, endDay)
                const categories = Array.from(new Set(data.map((item: AiStatsDaily) => item.score_type)))

                return consistentDates.map((date) => {
                    const dayData: { [key: string]: any } = { day: date }
                    categories.forEach((category) => {
                        const existingData = data.find((item) => item.day === date && item.score_type === category)
                        dayData[category] = existingData ? existingData.record_count : 0
                    })
                    return dayData
                })
            },
        },
        {
            title: "AI Stats - Tokens Used",
            dataKey: "total_tokens",
            colors: aiColors,
            formatYAxis: formatNumber,
            getCategories: (data) => Array.from(new Set(data.map((item: AiStatsDaily) => item.score_type))),
            getData: (data) => {
                if (!filteredData) return []
                const startDay = getDateRange[sliderValues[0]]
                const endDay = getDateRange[sliderValues[1]]
                const consistentDates = createConsistentDateRange(startDay, endDay)
                const categories = Array.from(new Set(data.map((item: AiStatsDaily) => item.score_type)))

                return consistentDates.map((date) => {
                    const dayData: { [key: string]: any } = { day: date }
                    categories.forEach((category) => {
                        const existingData = data.find((item) => item.day === date && item.score_type === category)
                        dayData[category] = existingData ? existingData.total_tokens : 0
                    })
                    return dayData
                })
            },
        },
        {
            title: "Lambda Stats - Invocation Count",
            dataKey: "invocation_count",
            colors: lambdaColors,
            getCategories: (data) => Array.from(new Set(data.map((item: LambdaStatsDaily) => item.function_type))),
            getData: (data) => {
                if (!filteredData) return []
                const startDay = getDateRange[sliderValues[0]]
                const endDay = getDateRange[sliderValues[1]]
                const consistentDates = createConsistentDateRange(startDay, endDay)
                const categories = Array.from(new Set(data.map((item: LambdaStatsDaily) => item.function_type)))

                return consistentDates.map((date) => {
                    const dayData: { [key: string]: any } = { day: date }
                    categories.forEach((category) => {
                        const existingData = data.find((item) => item.day === date && item.function_type === category)
                        dayData[category] = existingData ? existingData.invocation_count : 0
                    })
                    return dayData
                })
            },
        },
        {
            title: "Lambda Stats - Total Billed Duration",
            dataKey: "total_billed_duration",
            colors: lambdaColors,
            getCategories: (data) => Array.from(new Set(data.map((item: LambdaStatsDaily) => item.function_type))),
            getData: (data) => {
                if (!filteredData) return []
                const startDay = getDateRange[sliderValues[0]]
                const endDay = getDateRange[sliderValues[1]]
                const consistentDates = createConsistentDateRange(startDay, endDay)
                const categories = Array.from(new Set(data.map((item: LambdaStatsDaily) => item.function_type)))

                return consistentDates.map((date) => {
                    const dayData: { [key: string]: any } = { day: date }
                    categories.forEach((category) => {
                        const existingData = data.find((item) => item.day === date && item.function_type === category)
                        // Convert milliseconds to seconds with 1 decimal place
                        dayData[category] = existingData
                            ? Math.round((existingData.total_billed_duration / 1000) * 10) / 10
                            : 0
                    })
                    return dayData
                })
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
                    {/* Date Range Slider */}
                    {getDateRange.length > 1 && (
                        <Box
                            width="100%"
                            borderRadius={{ base: "0px", sm: "16px" }}
                            pt={12}
                            pb={3}
                            px={{ base: 1, sm: 2 }}
                        >
                            <Flex direction="row" justifyContent="center" alignItems="center" px={{ base: 4, sm: 0 }}>
                                <Slider.Root
                                    value={sliderValues}
                                    min={0}
                                    max={sliderMax}
                                    step={1}
                                    onValueChange={({ value }) => handleSliderChange(value)}
                                    width="100%"
                                    bg={"contentBackground"}
                                    py={2}
                                    px={2}
                                    borderRadius={"full"}
                                >
                                    <Slider.Control cursor="pointer">
                                        <Slider.Track height="10px" borderRadius="5px" bg={"pageBackground"}>
                                            <Slider.Range bg={"teal.500"} />
                                        </Slider.Track>
                                        <Slider.Thumb
                                            index={0}
                                            boxSize={6}
                                            cursor="pointer"
                                            bg={"teal.500"}
                                            border="2px solid"
                                            borderColor="teal.500"
                                        >
                                            <Box
                                                position="absolute"
                                                top="50%"
                                                left="50%"
                                                transform="translate(-50%, -50%)"
                                            >
                                                <FontAwesomeIcon icon={faBars} color="white" size="sm" />
                                            </Box>
                                            <Box
                                                position="absolute"
                                                top="-37px"
                                                left="50%"
                                                transform="translateX(-50%)"
                                                bg={"pageBackground"}
                                                borderRadius={"full"}
                                                px={2}
                                                py={1}
                                                fontSize="xs"
                                                fontWeight="bold"
                                                whiteSpace="nowrap"
                                            >
                                                {getDateRange[sliderValues[0]]
                                                    ? formatDate(new Date(getDateRange[sliderValues[0]]))
                                                    : ""}
                                            </Box>
                                        </Slider.Thumb>
                                        <Slider.Thumb
                                            index={1}
                                            boxSize={6}
                                            cursor="pointer"
                                            bg={"teal.500"}
                                            border="2px solid"
                                            borderColor="teal.500"
                                        >
                                            <Box
                                                position="absolute"
                                                top="50%"
                                                left="50%"
                                                transform="translate(-50%, -50%)"
                                            >
                                                <FontAwesomeIcon icon={faBars} color="white" size="sm" />
                                            </Box>
                                            <Box
                                                position="absolute"
                                                top="-37px"
                                                left="50%"
                                                transform="translateX(-50%)"
                                                bg={"pageBackground"}
                                                borderRadius={"full"}
                                                px={2}
                                                py={1}
                                                fontSize="xs"
                                                fontWeight="bold"
                                                whiteSpace="nowrap"
                                            >
                                                {getDateRange[sliderValues[1]]
                                                    ? formatDate(new Date(getDateRange[sliderValues[1]]))
                                                    : ""}
                                            </Box>
                                        </Slider.Thumb>
                                    </Slider.Control>
                                </Slider.Root>
                            </Flex>
                        </Box>
                    )}

                    <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6} w={"100%"}>
                        <GridItem>
                            <StatsLineChart
                                title={chartConfigs[0].title}
                                data={filteredData?.totalUsersDaily || []}
                                config={chartConfigs[0]}
                            />
                        </GridItem>
                        <GridItem>
                            <StatsLineChart
                                title={chartConfigs[0].title}
                                data={filteredData?.totalUsersDaily || []}
                                config={chartConfigs[0]}
                            />
                        </GridItem>
                        <GridItem>
                            <StatsChart
                                title={chartConfigs[1].title}
                                data={filteredData?.aiStatsDaily || []}
                                config={chartConfigs[1]}
                            />
                        </GridItem>
                        <GridItem>
                            <StatsChart
                                title={chartConfigs[2].title}
                                data={filteredData?.aiStatsDaily || []}
                                config={chartConfigs[2]}
                            />
                        </GridItem>
                        <GridItem>
                            <StatsChart
                                title={chartConfigs[3].title}
                                data={filteredData?.lambdaStatsDaily || []}
                                config={chartConfigs[3]}
                            />
                        </GridItem>
                        <GridItem>
                            <StatsChart
                                title={chartConfigs[4].title}
                                data={filteredData?.lambdaStatsDaily || []}
                                config={chartConfigs[4]}
                            />
                        </GridItem>
                    </Grid>
                </VStack>
            )}
        </SettingsSectionContainer>
    )
}
