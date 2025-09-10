"use client"

import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import { Text, VStack, Spinner, Box } from "@chakra-ui/react"

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
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={extendedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                {/* <CartesianGrid strokeDasharray="8 8" horizontal={true} vertical={false} /> */}
                <XAxis
                    dataKey="day"
                    angle={-45}
                    textAnchor="end"
                    tickFormatter={formatDate}
                    interval="preserveStartEnd"
                />
                <YAxis domain={[0, maxY]} />
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
