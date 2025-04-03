"use client"

import { VStack, Text } from "@chakra-ui/react"
import Leaderboard from "./Leaderboard"

export default function LeaderboardContainer({ project }: { project: string }) {
    return (
        <VStack gap={10} w="100%" maxW="800px" borderRadius="20px">
            <VStack fontSize="3xl" fontWeight="bold" px={6} pt={6} w="100%" textAlign="center">
                <Text>💧 Lido Leaderboard</Text>
            </VStack>

            <Leaderboard project={project} />
        </VStack>
    )
}
