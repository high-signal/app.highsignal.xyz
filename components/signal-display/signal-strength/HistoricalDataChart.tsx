"use client"

import React from "react"
import { useInView } from "react-intersection-observer"
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Label,
    ReferenceArea,
    CartesianGrid,
} from "recharts"
import { HStack, Text, VStack, useToken, Box } from "@chakra-ui/react"
import { useColorMode } from "../../color-mode/ColorModeProvider"
import { customConfig } from "../../../styles/theme"

export default function HistoricalDataChart({
    data,
    signalStrengthProjectData,
}: {
    data: SignalStrengthUserData[]
    signalStrengthProjectData: SignalStrengthProjectData
}) {
    // Extract the color token reference based on current color mode
    const { colorMode } = useColorMode()
    const textColorMutedToken = customConfig.theme?.semanticTokens?.colors?.textColorMuted?.value as {
        _light: string
        _dark: string
    }
    const textColorMutedColorTokenRef = colorMode === "dark" ? textColorMutedToken._dark : textColorMutedToken._light
    const textColorMutedColorToken = textColorMutedColorTokenRef.replace("{colors.", "").replace("}", "")
    const [textColorMutedHex] = useToken("colors", [textColorMutedColorToken])

    if (!data || data.length === 0) {
        return (
            <VStack align="center" justify="center" h="100%" w="100%">
                <Text fontSize="lg">No data available</Text>
            </VStack>
        )
    }

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
    const dataReversed = [...data].reverse()

    // Format date
    const formatDate = (day: string) => new Date(day).toISOString().split("T")[0]

    // Find largest maxValue
    const maxY = Math.max(...dataReversed.map((d) => d.maxValue))

    // Yesterday
    const yesterday = new Date()
    yesterday.setHours(0, 0, 0, 0)
    yesterday.setDate(yesterday.getDate() - 1)

    // 360 days ago
    const pastDate = new Date(yesterday)
    pastDate.setDate(pastDate.getDate() - 360)

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
            <VStack
                alignItems={"center"}
                gap={2}
                px={3}
                py={1}
                bg={"pageBackground"}
                borderRadius={"12px"}
                border={"3px solid"}
                borderColor={"contentBorder"}
            >
                <Text fontWeight={"bold"} wordSpacing={"5px"}>
                    {formatLocalDate(new Date(dateLabel))}
                </Text>
                {point && (
                    <VStack alignItems={"center"} w={"100%"} justifyContent={"space-between"} gap={1}>
                        <Text>
                            {signalStrengthProjectData.displayName.split(" ").slice(0, -1).join(" ")} Daily Engagement
                            Score
                        </Text>
                        <Text fontFamily={"monospace"} fontSize={"md"} fontWeight={"bold"}>
                            {point.value}/{point.maxValue}
                        </Text>
                    </VStack>
                )}
            </VStack>
        )
    }

    const AnimatedDot = ({ cx, cy, r, index, total }: any) => {
        const totalDuration = 2 // total animation duration in seconds
        const perDotDelay = total > 1 ? totalDuration / total : 0

        return (
            <circle cx={cx} cy={cy} r={0} fill={"#029E03"} opacity={0}>
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
        <HStack ref={ref} w="100%" h="300px" opacity={inView ? 1 : 0} transition="opacity 0.5s ease-in-out" gap={0}>
            {inView && (
                <>
                    <Box w="100%" h="100%" zIndex={5} overflow="visible">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={dataWithTimestamps}
                                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                            >
                                <CartesianGrid stroke="none" fill={"#001B36"} fillOpacity={1} />
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
                                    stroke="#029E03"
                                    dot={(props) => {
                                        const { key, ...rest } = props
                                        return <AnimatedDot key={key} {...rest} total={dataWithTimestamps.length} />
                                    }}
                                    activeDot={{
                                        r: 6,
                                        fill: "#029E03",
                                        stroke: textColorMutedHex,
                                        strokeWidth: 0,
                                    }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </Box>
                    <HStack w="fit-content" h="5px" gap={0} zIndex={2}>
                        <Box w="15px" h="260px" mb={"20px"} ml={"-10px"} bg={"pageBackground"} />
                        <Box w="10px" h="6px" position="relative" mb={"25px"}>
                            <Box
                                className="rainbow-animation"
                                position="absolute"
                                top={"2px"}
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
