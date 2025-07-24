"use client"

import { HStack, Text, VStack } from "@chakra-ui/react"
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

export default function ForumAccountPrivateError() {
    return (
        <VStack
            w={"100%"}
            justify={"center"}
            bg={"pageBackground"}
            border={"3px solid"}
            borderColor={"gold.500"}
            px={2}
            py={2}
            borderRadius={"16px"}
            textAlign={"center"}
            mt={2}
        >
            <HStack w={"100%"} fontWeight={"bold"} justifyContent={"center"} color={"gold.500"}>
                <FontAwesomeIcon icon={faTriangleExclamation} />
                <Text>Warning - Your account is private</Text>
                <FontAwesomeIcon icon={faTriangleExclamation} color={"gold.500"} />
            </HStack>
            <Text fontSize={"sm"} fontWeight={"bold"}>
                It looks like your forum account has been set to private.
            </Text>
            <Text fontSize={"sm"} fontWeight={"bold"}>
                High Signal can only view activity from public accounts.
            </Text>
            <Text fontSize={"sm"} fontWeight={"bold"}>
                Please make your account public if you would like your activity on this forum account to contribute to
                your Signal Score.
            </Text>
        </VStack>
    )
}
