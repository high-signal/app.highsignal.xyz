"use client"

import { Button, Link, Text, VStack } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faExternalLink } from "@fortawesome/free-solid-svg-icons"

export default function AllUsersApiTab({ project }: { project: ProjectData }) {
    const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/users/?apiKey=${project.apiKey}&project=${project.urlSlug}&page=1`

    return (
        <VStack maxW={"100%"} gap={0} alignItems={"start"}>
            <VStack maxW={"100%"} gap={5} alignItems={"start"}>
                <Text w={"100%"}>
                    Use this API with pagination to fetch historical data for all users and their shared accounts that
                    are either public or shared with {project.displayName} directly.
                </Text>
                <VStack alignItems={"start"} gap={1}>
                    <Text fontWeight={"bold"}>URL Path</Text>
                    <Text
                        bg={"pageBackground"}
                        px={3}
                        py={1}
                        borderRadius={"full"}
                    >{`${process.env.NEXT_PUBLIC_SITE_URL}/api/users`}</Text>
                </VStack>
                <VStack alignItems={"start"} gap={1}>
                    <Text fontWeight={"bold"}>URL Params</Text>
                    <Text bg={"pageBackground"} px={3} py={1} borderRadius={"full"}>{`apiKey=<YOUR_API_KEY>`}</Text>
                    <Text
                        bg={"pageBackground"}
                        px={3}
                        py={1}
                        borderRadius={"full"}
                    >{`project=${project.urlSlug}`}</Text>
                    <Text bg={"pageBackground"} px={3} py={1} borderRadius={"full"}>{`page=1`}</Text>
                </VStack>
                <VStack alignItems={"start"} gap={1}>
                    <Text fontWeight={"bold"}>Full URL</Text>
                    <Link href={apiUrl} target="_blank" textDecoration={"none"} maxW={"500px"}>
                        <Button
                            secondaryButton
                            px={3}
                            py={1}
                            borderRadius={"16px"}
                            maxW={"500px"}
                            h="auto"
                            whiteSpace="normal"
                            textAlign="center"
                        >
                            <Text
                                lineBreak={"anywhere"}
                                maxW={"500px"}
                                wordBreak="break-all"
                                whiteSpace="normal"
                                overflowWrap="break-word"
                            >
                                {apiUrl}
                            </Text>
                            <FontAwesomeIcon icon={faExternalLink} size="lg" />
                        </Button>
                    </Link>
                </VStack>
                <VStack alignItems={"start"} gap={1} w={"100%"}>
                    <Text fontWeight={"bold"}>Example Response</Text>
                    <Text
                        bg={"pageBackground"}
                        px={2}
                        py={2}
                        borderRadius={"8px"}
                        fontFamily={"monospace"}
                        fontSize={"sm"}
                        whiteSpace="pre-wrap"
                        w={"100%"}
                    >
                        {`{
  "data": [...],
  "maxPage": 1,
  "totalResults": 1,
  "currentPage": 1,
  "resultsPerPage": 100
}`}
                    </Text>
                </VStack>
                <VStack alignItems={"start"} gap={1} w={"100%"}>
                    <Text fontWeight={"bold"}>Example data</Text>
                    <Text
                        bg={"pageBackground"}
                        px={2}
                        py={2}
                        borderRadius={"8px"}
                        fontFamily={"monospace"}
                        fontSize={"sm"}
                        whiteSpace="pre-wrap"
                        w={"100%"}
                    >
                        {`{
  "username": "eridian",
  "displayName": "Eridian",
  "rank": 16,
  "score": 54,
  "addresses": [
    "0x1234567890123456789012345678901234567890",
    "0x1234567890123456789012345678901234567891"
  ]
}`}
                    </Text>
                </VStack>
            </VStack>
        </VStack>
    )
}
