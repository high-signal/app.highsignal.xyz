"use client"

import { VStack, Text, Table } from "@chakra-ui/react"

export default function HistoricalDataTable({
    title,
    userData,
    rawUserData,
}: {
    title: string
    userData: SignalStrengthUserData[]
    rawUserData: SignalStrengthUserData[]
}) {
    // Deduplicate source data by day, keeping the latest entry for each day
    const deduplicatedUserData = userData.reduce((acc, current) => {
        const existingIndex = acc.findIndex((item) => item.day === current.day)
        if (existingIndex >= 0) {
            // Replace existing entry with current one (assuming current is more recent)
            acc[existingIndex] = current
        } else {
            acc.push(current)
        }
        return acc
    }, [] as SignalStrengthUserData[])

    const deduplicatedRawUserData = rawUserData.reduce((acc, current) => {
        const existingIndex = acc.findIndex((item) => item.day === current.day)
        if (existingIndex >= 0) {
            // Replace existing entry with current one (assuming current is more recent)
            acc[existingIndex] = current
        } else {
            acc.push(current)
        }
        return acc
    }, [] as SignalStrengthUserData[])

    // Combine and sort all unique days
    const allDays = [
        ...new Set([...deduplicatedUserData.map((d) => d.day), ...deduplicatedRawUserData.map((d) => d.day)]),
    ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    // Function to consolidate consecutive rows with no raw score and identical smart scores
    const consolidateRows = (days: string[]) => {
        const consolidatedRows: Array<{ day: string; type: "normal" | "consolidated" }> = []
        let consecutiveCount = 0
        let lastSmartScore: string | null = null
        let startIndex = -1

        for (let i = 0; i < days.length; i++) {
            const day = days[i]
            const processedData = deduplicatedUserData.find((d) => d.day === day)
            const rawData = deduplicatedRawUserData.find((d) => d.day === day)

            const hasNoRawScore = !rawData
            const smartScore = processedData ? `${processedData.value}/${processedData.maxValue}` : "-"

            if (hasNoRawScore && smartScore === lastSmartScore) {
                // Continue consecutive streak
                consecutiveCount++
                if (startIndex === -1) {
                    startIndex = i
                }
            } else {
                // End of consecutive streak or different condition
                if (consecutiveCount >= 3) {
                    // Add consolidated row
                    consolidatedRows.push({ day: days[startIndex], type: "consolidated" })
                    // Skip the middle rows
                    i = startIndex + consecutiveCount - 1
                } else if (consecutiveCount > 0) {
                    // Add back the individual rows for streaks less than 3
                    for (let j = startIndex; j < i; j++) {
                        consolidatedRows.push({ day: days[j], type: "normal" })
                    }
                }

                // Add current row (only if we're not in the middle of a consolidated streak)
                if (consecutiveCount < 3) {
                    consolidatedRows.push({ day, type: "normal" })
                }

                // Reset counters
                consecutiveCount = hasNoRawScore ? 1 : 0
                lastSmartScore = hasNoRawScore ? smartScore : null
                startIndex = hasNoRawScore ? i : -1
            }
        }

        // Handle any remaining consecutive streak at the end
        if (consecutiveCount >= 3) {
            // Remove the last few normal rows and add consolidated
            consolidatedRows.splice(-consecutiveCount)
            consolidatedRows.push({ day: days[startIndex], type: "consolidated" })
        } else if (consecutiveCount > 0) {
            // Add back the individual rows for streaks less than 3 at the end
            for (let j = startIndex; j < days.length; j++) {
                consolidatedRows.push({ day: days[j], type: "normal" })
            }
        }

        // Filter out smart-score-only rows that follow rows with both smart and raw scores with identical smart scores
        const filteredRows = consolidatedRows.filter((row, index) => {
            if (row.type === "consolidated") {
                return true // Always keep consolidated rows
            }

            if (index === 0) {
                return true // Always keep the first row
            }

            const currentDay = row.day
            const currentProcessedData = deduplicatedUserData.find((d) => d.day === currentDay)
            const currentRawData = deduplicatedRawUserData.find((d) => d.day === currentDay)
            const currentSmartScore = currentProcessedData
                ? `${currentProcessedData.value}/${currentProcessedData.maxValue}`
                : "-"

            // Check if current row has no raw score
            if (!currentRawData) {
                // Look at the previous row
                const prevRow = consolidatedRows[index - 1]
                if (prevRow.type === "normal") {
                    const prevDay = prevRow.day
                    const prevProcessedData = deduplicatedUserData.find((d) => d.day === prevDay)
                    const prevRawData = deduplicatedRawUserData.find((d) => d.day === prevDay)
                    const prevSmartScore = prevProcessedData
                        ? `${prevProcessedData.value}/${prevProcessedData.maxValue}`
                        : "-"

                    // If previous row has both smart and raw scores, and smart scores are identical, hide current row
                    if (prevRawData && currentSmartScore === prevSmartScore) {
                        return false
                    }
                }
            }

            return true
        })

        // Final deduplication to ensure no duplicate days and no consecutive consolidated rows
        const uniqueRows = filteredRows.reduce(
            (acc, current) => {
                if (current.type === "consolidated") {
                    // Check if the previous row is also consolidated - if so, skip this one
                    if (acc.length > 0 && acc[acc.length - 1].type === "consolidated") {
                        return acc
                    }
                    acc.push(current)
                    return acc
                } else {
                    // For normal rows, check if we already have this day
                    const existingIndex = acc.findIndex((item) => item.day === current.day)
                    if (existingIndex >= 0) {
                        // If we already have this day, don't add the duplicate
                        return acc
                    } else {
                        acc.push(current)
                        return acc
                    }
                }
            },
            [] as Array<{ day: string; type: "normal" | "consolidated" }>,
        )

        // Filter out consolidated rows that have no smart scores below them
        const finalRows = uniqueRows.filter((row, index) => {
            if (row.type === "consolidated") {
                // Check if there are any smart scores below this consolidated row
                const rowsBelow = uniqueRows.slice(index + 1)
                const hasSmartScoresBelow = rowsBelow.some((belowRow) => {
                    if (belowRow.type === "normal") {
                        const processedData = deduplicatedUserData.find((d) => d.day === belowRow.day)
                        return (
                            processedData && processedData.value !== undefined && processedData.maxValue !== undefined
                        )
                    }
                    return false
                })

                // Only keep consolidated rows if there are smart scores below them
                return hasSmartScoresBelow
            }
            return true
        })

        return finalRows
    }

    const consolidatedRows = consolidateRows(allDays)

    return (
        <VStack gap={2} pb={5} minW={"320px"}>
            <Text w={"100%"} textAlign={"center"} fontWeight={"bold"} fontSize={"lg"}>
                {title}
            </Text>
            <Table.Root borderRadius={"12px"} overflow={"hidden"}>
                <Table.Header>
                    <Table.Row bg={"pageBackground"}>
                        <Table.ColumnHeader borderColor={"contentBorder"}>Day</Table.ColumnHeader>
                        <Table.ColumnHeader borderColor={"contentBorder"}>Raw Value</Table.ColumnHeader>
                        <Table.ColumnHeader borderColor={"contentBorder"}>Smart Value</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body fontFamily={"monospace"} fontSize={"sm"} fontWeight={"bold"}>
                    {consolidatedRows.map((row, index) => {
                        if (row.type === "consolidated") {
                            return (
                                <Table.Row key={`consolidated-${row.day}`} bg={"pageBackground"}>
                                    <Table.Cell
                                        borderColor={"contentBorder"}
                                        borderBottom={index !== consolidatedRows.length - 1 ? undefined : "none"}
                                        colSpan={3}
                                    >
                                        <Text textAlign={"center"} fontStyle={"italic"} color={"gray.500"}>
                                            ... No changes to smart score ...
                                        </Text>
                                    </Table.Cell>
                                </Table.Row>
                            )
                        }

                        const day = row.day
                        const processedData = deduplicatedUserData.find((d) => d.day === day)
                        const rawData = deduplicatedRawUserData.find((d) => d.day === day)

                        return (
                            <Table.Row key={day} bg={"pageBackground"}>
                                <Table.Cell
                                    borderColor={"contentBorder"}
                                    borderBottom={index !== consolidatedRows.length - 1 ? undefined : "none"}
                                >
                                    {day}
                                </Table.Cell>
                                <Table.Cell
                                    borderColor={"contentBorder"}
                                    borderBottom={index !== consolidatedRows.length - 1 ? undefined : "none"}
                                >
                                    <Text textAlign={"center"}>
                                        {rawData ? `${rawData.rawValue}/${rawData.maxValue}` : "-"}
                                    </Text>
                                </Table.Cell>
                                <Table.Cell
                                    borderColor={"contentBorder"}
                                    borderBottom={index !== consolidatedRows.length - 1 ? undefined : "none"}
                                >
                                    <Text textAlign={"center"}>
                                        {processedData ? `${processedData.value}/${processedData.maxValue}` : "-"}
                                    </Text>
                                </Table.Cell>
                            </Table.Row>
                        )
                    })}
                </Table.Body>
            </Table.Root>
        </VStack>
    )
}
