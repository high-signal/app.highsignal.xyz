import { HStack, VStack, Box, Text } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronRight } from "@fortawesome/free-solid-svg-icons"
import { useState } from "react"

export default function SignalStrength({ data }: { data: SignalStrengthData }) {
    const percentageCompleted = (Number(data.value) / Number(data.maxValue)) * 100
    const completedBarWidth = percentageCompleted > 100 ? "100%" : `${percentageCompleted}%`
    const [isOpen, setIsOpen] = useState(true)

    return (
        <VStack alignItems={"center"} gap={3} w={"100%"} bg="gray.900" py={3} px={3} borderRadius={"16px"}>
            <HStack
                alignItems={"baseline"}
                py={2}
                px={3}
                justifyContent={"center"}
                border={"5px solid"}
                borderColor={"pageBackground"}
                borderRadius={"12px"}
                w={"100%"}
            >
                <Text fontSize="lg" fontWeight={"bold"}>
                    {data.displayName}
                </Text>
                <Text bg={"green.500"} fontSize="xl" px={2} borderRadius="8px" color="#029E03">
                    {data.value}
                </Text>
            </HStack>
            <HStack
                w="100%"
                justifyContent={"space-between"}
                alignItems={"center"}
                fontFamily={"monospace"}
                fontSize={"lg"}
                color={"gray.400"}
            >
                <Text>0</Text>
                <Box w="100%" h="26px" bg="gray.800" borderRadius="md" overflow="hidden">
                    <Box
                        w={completedBarWidth}
                        h="100%"
                        bg="green.500"
                        borderRight={"2px solid"}
                        borderColor="#029E03"
                    />
                </Box>
                <Text>{data.maxValue}</Text>
            </HStack>
            <VStack w="100%" gap={0} alignItems={"start"}>
                <HStack
                    cursor="pointer"
                    py={2}
                    pl={3}
                    pr={4}
                    gap={3}
                    w={"100%"}
                    bg={"pageBackground"}
                    borderRadius={"10px"}
                    borderBottomRadius={isOpen ? "none" : "10px"}
                    onClick={() => setIsOpen(!isOpen)}
                    _hover={{ bg: "gray.800" }}
                >
                    <Box transform={isOpen ? "rotate(90deg)" : "rotate(0deg)"} transition="transform 0.2s">
                        <FontAwesomeIcon icon={faChevronRight} />
                    </Box>
                    <Text>{data.summary}</Text>
                </HStack>
                {isOpen && (
                    <Box w="100%" px={4} pt={2} pb={3} bg="pageBackground" borderBottomRadius="md">
                        <Text color="textColor">{data.description}</Text>
                    </Box>
                )}
            </VStack>
        </VStack>
    )
}
