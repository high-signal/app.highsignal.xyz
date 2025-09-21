"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { useInView } from "react-intersection-observer"
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, Label, CartesianGrid } from "recharts"
import { HStack, Text, Box } from "@chakra-ui/react"
import { useThemeColor } from "../../../utils/theme-utils/getThemeColor"

import { calculateSignalFromScore } from "../../../utils/calculateSignal"

import LoginToSeeInsights from "../../ui/LoginToSeeInsights"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons"

export default function HistoricalDataChart({
    data,
    signalStrengthProjectData,
    projectData,
}: {
    data: SignalStrengthUserData[]
    signalStrengthProjectData: SignalStrengthProjectData
    projectData: ProjectData
}) {
    const [dummyData, setDummyData] = useState<SignalStrengthUserData[]>([])
    const hasGeneratedDummyData = useRef(false)

    // Get theme colors using the utility function
    const textColorMutedHex = useThemeColor("textColorMuted")
    const pageBackgroundColorHex = useThemeColor("pageBackground")
    const highSignalColorHex = useThemeColor("scoreColor.high")
    const midSignalColorHex = useThemeColor("scoreColor.mid")
    const lowSignalColorHex = useThemeColor("scoreColor.low")

    const getSignalColorHex = (value: number, maxValue: number) => {
        const percentage = maxValue ? (value / maxValue) * 100 : 0
        const signal = calculateSignalFromScore(percentage)
        switch (signal) {
            case "high":
                return highSignalColorHex
            case "mid":
                return midSignalColorHex
            case "low":
                return lowSignalColorHex
            default:
                return lowSignalColorHex
        }
    }

    // Yesterday
    const yesterday = useMemo(() => {
        const date = new Date()
        date.setHours(0, 0, 0, 0)
        date.setDate(date.getDate() - 1)
        return date
    }, [])

    // 360 days ago
    const pastDate = useMemo(() => {
        const date = new Date(yesterday)
        date.setDate(date.getDate() - 360)
        return date
    }, [yesterday])

    // Helper to generate dummy historical points
    const generateDummyData = (
        count: number,
        startDate: Date,
        endDate: Date,
        maxValue: number,
        signalName: string,
    ): SignalStrengthUserData[] => {
        // Normalize to midnight for both bounds
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(endDate)
        end.setHours(0, 0, 0, 0)

        const dayMs = 24 * 60 * 60 * 1000
        const totalDays = Math.floor((end.getTime() - start.getTime()) / dayMs) + 1
        const numPoints = Math.max(0, Math.min(count, totalDays))

        // Sample unique day indices without replacement
        const indices = Array.from({ length: totalDays }, (_, i) => i)
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            const tmp = indices[i]
            indices[i] = indices[j]
            indices[j] = tmp
        }
        const selected = indices.slice(0, numPoints).sort((a, b) => a - b)

        const points: SignalStrengthUserData[] = []
        const minValue = Math.max(0, Math.floor(maxValue * 0.05))
        const maxValueCap = Math.max(minValue, Math.floor(maxValue * 0.95))

        for (const dayIndex of selected) {
            const d = new Date(start.getTime() + dayIndex * dayMs)
            d.setHours(0, 0, 0, 0)
            const value = Math.floor(Math.random() * (maxValueCap - minValue + 1)) + minValue
            points.push({
                day: d.toISOString(),
                name: signalName,
                value: String(value),
                maxValue: maxValue,
                summary: "Dummy data",
                description: "",
                improvements: "",
            })
        }

        return points
    }

    // Generate dummy data when the component mounts
    useEffect(() => {
        if (!hasGeneratedDummyData.current && (!data || data.length === 0)) {
            const startForDummy = new Date(pastDate)
            startForDummy.setDate(startForDummy.getDate() + 5)
            const endForDummy = new Date(yesterday)
            endForDummy.setDate(endForDummy.getDate() - 5)

            if (data.length > 0) {
                setDummyData(
                    generateDummyData(
                        30,
                        startForDummy,
                        endForDummy,
                        signalStrengthProjectData.maxValue,
                        signalStrengthProjectData.name,
                    ),
                )
                hasGeneratedDummyData.current = true
            }
        }
    }, [data, pastDate, yesterday, signalStrengthProjectData.maxValue, signalStrengthProjectData.name])

    const { ref, inView } = useInView({
        triggerOnce: true, // only trigger the first time
        threshold: 0.2, // % of chart visible before loading
    })

    const formatLocalDate = (date: Date) => {
        const day = date.getDate().toString().padStart(2, "0")
        const month = new Intl.DateTimeFormat(undefined, { month: "short" }).format(date) // localized short month
        const year = date.getFullYear()
        return `${day} ${month} ${year}`
    }

    // Reverse the data so it displays correctly on the chart
    const dataReversed = dummyData.length > 0 ? dummyData : [...data].reverse()

    // Format date
    const formatDate = (day: string) => new Date(day).toISOString().split("T")[0]

    // Find largest maxValue
    const maxY = Math.max(...dataReversed.map((d) => d.maxValue))

    // Convert your data day field into timestamps
    const dataWithTimestamps = dataReversed.map((d) => ({
        ...d,
        day: new Date(d.day).getTime(), // numeric timestamp
    }))

    const ChartTooltip = ({ payload, label }: { payload: any[]; label: string }) => {
        if (!payload || payload.length === 0) return null

        // Recharts provides the current datum on payload[0].payload
        const point = payload[0]?.payload as SignalStrengthUserData | undefined
        const dateLabel = label ? formatDate(label) : point ? formatDate(point.day as unknown as string) : ""

        return (
            <HStack
                alignItems={"center"}
                gap={2}
                bg={"pageBackground"}
                borderRadius={"16px"}
                border={"4px solid"}
                borderColor={getSignalColorHex(payload[0].payload.value, payload[0].payload.maxValue)}
                wrap={"wrap"}
                fontSize={"sm"}
            >
                <Text fontWeight={"bold"} wordSpacing={"5px"} color={"textColorMuted"} pl={2} py={1}>
                    {formatLocalDate(new Date(dateLabel))}
                </Text>
                <Box
                    w={"4px"}
                    h={"30px"}
                    bg={getSignalColorHex(payload[0].payload.value, payload[0].payload.maxValue)}
                />
                <Text fontWeight={"bold"} borderRadius={"16px"} pr={2} py={1}>
                    {point?.value}/{point?.maxValue}
                </Text>
            </HStack>
        )
    }

    const AnimatedDot = ({ cx, cy, r, index, total, props }: any) => {
        const totalDuration = 2 // total animation duration in seconds
        const perDotDelay = total > 1 ? totalDuration / total : 0

        return (
            <circle
                cx={cx}
                cy={cy}
                r={0}
                fill={getSignalColorHex(props?.payload?.value, props?.payload?.maxValue)}
                opacity={0}
            >
                <animate attributeName="r" from="0" to={r} dur="0.3s" begin={`${index * perDotDelay}s`} fill="freeze" />
                <animate
                    attributeName="opacity"
                    from="0"
                    to="1"
                    dur="0.3s"
                    begin={`${index * perDotDelay}s`}
                    fill="freeze"
                />
            </circle>
        )
    }

    return (
        <HStack
            ref={ref}
            w="100%"
            h="300px"
            opacity={inView ? 1 : 0}
            transition="opacity 0.5s ease-in-out"
            gap={0}
            pointerEvents={dummyData.length > 0 ? "none" : "auto"}
        >
            {inView && (
                <>
                    <Box w="100%" h="100%" zIndex={5} overflow="visible" position="relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={dataWithTimestamps}
                                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                            >
                                <defs>
                                    <pattern
                                        id="graphPaperPattern"
                                        width="20"
                                        height="20"
                                        patternUnits="userSpaceOnUse"
                                    >
                                        <rect
                                            width="20"
                                            height="20"
                                            fill="none"
                                            stroke={textColorMutedHex}
                                            strokeWidth="0.5"
                                            strokeOpacity="0.2"
                                        />
                                    </pattern>
                                </defs>

                                {/* Background color */}
                                <CartesianGrid stroke="none" fill={pageBackgroundColorHex} fillOpacity={1} />

                                {/* Graph paper pattern — clipped automatically */}
                                <CartesianGrid stroke="none" fill="url(#graphPaperPattern)" fillOpacity={1} />

                                <XAxis
                                    dataKey="day"
                                    type="number"
                                    scale="time"
                                    domain={[pastDate.getTime(), yesterday.getTime()]}
                                    stroke={textColorMutedHex}
                                    ticks={[pastDate.getTime(), yesterday.getTime()]} // Force only start + end ticks
                                    tickLine={true} // Show tick lines
                                    tickFormatter={() => ""} // Hide default text
                                >
                                    {/* Custom tick labels */}
                                    <Label
                                        value={formatLocalDate(pastDate)}
                                        position="insideBottomLeft"
                                        offset={7}
                                        dx={-8}
                                        style={{ fontSize: 16, fontFamily: "monospace", fill: textColorMutedHex }}
                                    />
                                    <Label
                                        value={formatLocalDate(yesterday)}
                                        position="insideBottomRight"
                                        offset={7}
                                        dx={8}
                                        style={{ fontSize: 16, fontFamily: "monospace", fill: textColorMutedHex }}
                                    />
                                </XAxis>
                                <YAxis
                                    domain={[0, maxY]}
                                    stroke={textColorMutedHex}
                                    tick={(props) => {
                                        const { x, y, payload } = props
                                        return (
                                            <text
                                                x={x}
                                                y={y + 6}
                                                textAnchor="end"
                                                fontSize={12}
                                                fontFamily="monospace"
                                                fill={textColorMutedHex}
                                            >
                                                {payload.value}
                                            </text>
                                        )
                                    }}
                                />
                                <Tooltip
                                    content={<ChartTooltip payload={[]} label={""} />}
                                    isAnimationActive={false}
                                    cursor={{ stroke: textColorMutedHex, strokeWidth: 2 }}
                                />
                                <Line
                                    name="value"
                                    data={dataWithTimestamps}
                                    dataKey="value"
                                    strokeWidth={0}
                                    strokeOpacity={0}
                                    isAnimationActive={false}
                                    dot={(props) => {
                                        const { key, ...rest } = props
                                        return (
                                            <AnimatedDot
                                                key={key}
                                                {...rest}
                                                total={dataWithTimestamps.length}
                                                props={props}
                                            />
                                        )
                                    }}
                                    activeDot={(props) => {
                                        const { payload, cx, cy } = props
                                        return (
                                            <circle
                                                cx={cx}
                                                cy={cy}
                                                r={6}
                                                fill={getSignalColorHex(payload?.value, payload?.maxValue)}
                                                stroke={textColorMutedHex}
                                                strokeWidth={0}
                                            />
                                        )
                                    }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                        {/* Blur overlay when dummy data is present */}
                        {data.length === 0 && (
                            <Box
                                position="absolute"
                                top="10px"
                                left="36px"
                                right="2px"
                                bottom="31px"
                                zIndex={100}
                                backdropFilter="blur(5px)"
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                                pointerEvents="auto"
                            >
                                {dummyData.length > 0 ? (
                                    <LoginToSeeInsights projectData={projectData} />
                                ) : (
                                    <HStack>
                                        <Box color={"textColorMuted"}>
                                            <FontAwesomeIcon icon={faInfoCircle} size="lg" />
                                        </Box>
                                        <Text>
                                            No activity in the past {signalStrengthProjectData.previousDays} days
                                        </Text>
                                    </HStack>
                                )}
                            </Box>
                        )}
                    </Box>
                    <HStack w="fit-content" h="5px" gap={0} zIndex={2}>
                        <Box w="15px" h="260px" mb={"20px"} ml={"-10px"} bg={"pageBackground"} />
                        <Box w="10px" h="6px" position="relative" mb={"25px"}>
                            <Box
                                className="rainbow-animation"
                                position="absolute"
                                top={"2.5px"}
                                left={"-8px"}
                                w="100%"
                                h="100%"
                                transform="rotate(90deg) scaleX(calc(26))"
                                transformOrigin="center"
                            />
                        </Box>
                    </HStack>
                </>
            )}
        </HStack>
    )
}
