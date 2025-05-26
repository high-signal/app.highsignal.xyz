import { VStack, Text, Table } from "@chakra-ui/react"

export default function HistoricalDataTable({
    userData,
    rawUserData,
}: {
    userData: SignalStrengthUserData[]
    rawUserData: SignalStrengthUserData[]
}) {
    // Combine and sort all unique days
    const allDays = [...new Set([...userData.map((d) => d.day), ...rawUserData.map((d) => d.day)])].sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    )

    return (
        <VStack gap={4}>
            <Text w={"100%"} py={2} textAlign={"center"} fontWeight={"bold"} fontSize={"lg"}>
                Historical Data
            </Text>
            <Table.Root borderRadius={"12px"} overflow={"hidden"}>
                <Table.Header>
                    <Table.Row bg={"pageBackground"}>
                        <Table.ColumnHeader borderColor={"contentBorder"}>Day</Table.ColumnHeader>
                        <Table.ColumnHeader borderColor={"contentBorder"}>Raw Value</Table.ColumnHeader>
                        <Table.ColumnHeader borderColor={"contentBorder"}>Smart Value</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {allDays.map((day) => {
                        const processedData = userData.find((d) => d.day === day)
                        const rawData = rawUserData.find((d) => d.day === day)

                        return (
                            <Table.Row key={day} bg={"pageBackground"}>
                                <Table.Cell
                                    borderColor={"contentBorder"}
                                    borderBottom={day !== allDays[allDays.length - 1] ? undefined : "none"}
                                >
                                    {day}
                                </Table.Cell>
                                <Table.Cell
                                    borderColor={"contentBorder"}
                                    borderBottom={day !== allDays[allDays.length - 1] ? undefined : "none"}
                                >
                                    <Text textAlign={"center"}>
                                        {rawData ? `${rawData.rawValue}/${rawData.maxValue}` : "-"}
                                    </Text>
                                </Table.Cell>
                                <Table.Cell
                                    borderColor={"contentBorder"}
                                    borderBottom={day !== allDays[allDays.length - 1] ? undefined : "none"}
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
