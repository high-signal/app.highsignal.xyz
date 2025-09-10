"use client"

import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import { Text, VStack, Box, useToken } from "@chakra-ui/react"
import { useColorMode } from "../../color-mode/ColorModeProvider"
import { customConfig } from "../../../styles/theme"

export default function HistoricalDataChart({
    data,
    signalStrengthProjectData,
}: {
    data: SignalStrengthUserData[]
    signalStrengthProjectData: SignalStrengthProjectData
}) {
    if (!data || data.length === 0) {
        return (
            <VStack align="center" justify="center" h="100%" w="100%">
                <Text fontSize="lg">No data available</Text>
            </VStack>
        )
    }

    // Extract the color token reference based on current color mode
    const { colorMode } = useColorMode()
    const textColorMutedToken = customConfig.theme?.semanticTokens?.colors?.textColorMuted?.value as {
        _light: string
        _dark: string
    }
    const textColorMutedColorTokenRef = colorMode === "dark" ? textColorMutedToken._dark : textColorMutedToken._light
    const textColorMutedColorToken = textColorMutedColorTokenRef.replace("{colors.", "").replace("}", "")
    const [textColorMutedHex] = useToken("colors", [textColorMutedColorToken])

    // Reverse the data so it displays correctly on the chart
    const dataReversed = [...data].reverse()

    // Format date
    const formatDate = (day: string) => new Date(day).toISOString().split("T")[0]

    // Find largest maxValue
    const maxY = Math.max(...dataReversed.map((d) => d.maxValue))

    // Clone data and add "today" point
    const extendedData = [...dataReversed]
    const firstPoint = dataReversed[dataReversed.length - 1]
    if (firstPoint) {
        const tomorrow = new Date(firstPoint.day)
        tomorrow.setDate(tomorrow.getDate() + 1)

        extendedData.push({
            day: tomorrow.toISOString().split("T")[0],
            name: "",
            summary: "",
            description: "",
            improvements: "",
            value: firstPoint.value,
            maxValue: signalStrengthProjectData.maxValue,
            currentDay: true,
        })
    }

    // Custom dot renderer for "value" line
    const CustomDot = (props: any) => {
        const { cx, cy, payload } = props
        if (payload.currentDay) {
            return (
                <foreignObject x={cx - 8} y={cy - 8} width={16} height={16}>
                    {/* <Spinner size="xs" color="blue.500" /> */}
                    <Box className="rainbow-animation" w={"16px"} h={"16px"} borderRadius={"full"} zIndex={1000} />
                </foreignObject>
            )
        }
        return <circle cx={cx} cy={cy} r={0} fill="#029E03" />
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={extendedData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <XAxis
                    dataKey="day"
                    interval={0} // show all ticks (this is overridden later with ticks[])
                    ticks={[extendedData[0].day, extendedData[extendedData.length - 1].day]} // only oldest & newest
                    stroke={textColorMutedHex}
                    tick={(props) => {
                        const { x, y, payload, index } = props
                        const isFirst = index === 0
                        const isLast = index === 1 // we only have 2 ticks
                        const anchor = isFirst ? "start" : isLast ? "end" : "middle"

                        return (
                            <text
                                x={x}
                                y={y + 20}
                                textAnchor={anchor}
                                fontSize={12}
                                fontFamily="monospace"
                                fill={textColorMutedHex}
                            >
                                {formatDate(payload.value)}
                            </text>
                        )
                    }}
                />
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
                    labelFormatter={(label) => formatDate(label)}
                    formatter={(value: number, name: string) => [value, name === "value" ? "Value" : "Max"]}
                />
                {/* main value line */}
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#029E03"
                    strokeWidth={5}
                    dot={<CustomDot />}
                    strokeLinecap="round"
                    isAnimationActive={true}
                    name="value"
                />
                {/* maxValue line */}
                {/* <Line
                    type="monotone"
                    dataKey="maxValue"
                    stroke="red"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    strokeDasharray="4 4"
                    isAnimationActive={false}
                    name="maxValue"
                /> */}
            </LineChart>
        </ResponsiveContainer>
    )
}
