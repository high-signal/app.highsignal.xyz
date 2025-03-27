import { VStack, HStack, Text, Box, Button, SimpleGrid, Span } from "@chakra-ui/react"

import Image from "next/image"
import SignalBox from "./SignalBox"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"

export default function Leaderboard() {
    return (
        <Box w="100%" maxW="600px" borderRadius="20px" p={6} zIndex={10}>
            <Text fontSize="2xl" fontWeight="bold">
                Leaderboard
            </Text>
        </Box>
    )
}
