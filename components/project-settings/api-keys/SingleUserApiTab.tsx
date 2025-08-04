"use client"

import { HStack, Button, Link, Text, VStack } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faExternalLink } from "@fortawesome/free-solid-svg-icons"

import { useUser } from "../../../contexts/UserContext"

export default function SingleUserApiTab({ project }: { project: ProjectData }) {
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
    const yesterdayString = yesterday.toISOString().split("T")[0]

    const twoDaysAgo = new Date(new Date().setDate(new Date().getDate() - 2))
    const twoDaysAgoString = twoDaysAgo.toISOString().split("T")[0]

    const { loggedInUser } = useUser()

    const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/data/v1/user/?project=${project.urlSlug}&searchType=highSignalUsername&searchValue=${loggedInUser?.username}&startDate=${twoDaysAgoString}&endDate=${yesterdayString}&apiKey=${project.apiKey}`

    return (
        <VStack maxW={"100%"} gap={0} alignItems={"start"}>
            <VStack maxW={"100%"} gap={5} alignItems={"start"}>
                <Text w={"100%"}>
                    Use this API to fetch historical data for a single user and their shared accounts that are either
                    public or shared with {project.displayName} directly.
                </Text>
                <VStack alignItems={"start"} gap={1}>
                    <Text fontWeight={"bold"}>URL Path</Text>
                    <Text
                        bg={"pageBackground"}
                        px={3}
                        py={1}
                        borderRadius={"full"}
                    >{`${process.env.NEXT_PUBLIC_SITE_URL}/api/data/v1/user`}</Text>
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
                    <Text bg={"pageBackground"} px={3} py={1} borderRadius={"full"}>{`searchType=<SEARCH_TYPE>`}</Text>
                    <Text
                        bg={"pageBackground"}
                        px={3}
                        py={1}
                        borderRadius={"full"}
                    >{`searchValue=<SEARCH_VALUE>`}</Text>
                    <Text bg={"pageBackground"} px={3} py={1} borderRadius={"full"}>{`startDate=YYYY-MM-DD`}</Text>
                    <HStack>
                        <Text bg={"pageBackground"} px={3} py={1} borderRadius={"full"}>{`endDate=YYYY-MM-DD`}</Text>
                        <Text>(optional)</Text>
                    </HStack>
                </VStack>
                <VStack alignItems={"start"} gap={1}>
                    <Text fontWeight={"bold"}>Example URL</Text>
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
  "username": "eridian",
  "displayName": "Eridian",
  "addresses": [
    "0x1234567890123456789012345678901234567890",
    "0x1234567890123456789012345678901234567891"
  ],
  "discordUsername": eridianalpha#0,
  "totalScores": [
    {
      "day": "${yesterdayString}",
      "totalScore": 90
    },
    {
      "day": "${twoDaysAgoString}",
      "totalScore": 85
    }
  ]
  "signalStrengths": [
    {
      "signalStrengthName": "discourse_forum",
      "data": [
        {
          "day": "${yesterdayString}",
          "value": 90,
          "maxValue": 100,
          "scoreCalculationPeriodPreviousDays": 180,
        },
        {
          "day": "${twoDaysAgoString}",
          "value": 85,
          "maxValue": 100,
          "scoreCalculationPeriodPreviousDays": 180,
        }
      ]
    }
  ]
}`}
                    </Text>
                </VStack>
            </VStack>
        </VStack>
    )
}
