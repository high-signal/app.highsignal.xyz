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
                <VStack alignItems={"start"} gap={2}>
                    <Text fontWeight={"bold"}>URL Params</Text>
                    <Text bg={"pageBackground"} px={3} py={1} borderRadius={"full"}>{`apiKey=<YOUR_API_KEY>`}</Text>
                    <Text
                        bg={"pageBackground"}
                        px={3}
                        py={1}
                        borderRadius={"full"}
                    >{`project=${project.urlSlug}`}</Text>
                    <VStack
                        bg={"pageBackground"}
                        px={3}
                        py={2}
                        borderRadius={"16px"}
                        alignItems={"start"}
                        gap={1}
                        color={"textColorMuted"}
                    >
                        <Text color={"textColor"}>{`searchType=<SEARCH_TYPE>`}</Text>
                        <li>highSignalUsername</li>
                        <li>ethereumAddress</li>
                        <li>email</li>
                        <li>discordUsername</li>
                        <li>xUsername</li>
                        <li>farcasterUsername</li>
                    </VStack>
                    <VStack
                        bg={"pageBackground"}
                        px={3}
                        py={2}
                        borderRadius={"16px"}
                        alignItems={"start"}
                        gap={1}
                        color={"textColorMuted"}
                    >
                        <Text color={"textColor"}>{`searchValue=<SEARCH_VALUE>`}</Text>
                        <ul style={{ margin: 0, paddingLeft: "1.5rem", listStyleType: "disc" }}>
                            <li style={{ marginBottom: "0.25rem" }}>All search values are case sensitive.</li>
                            <li style={{ marginBottom: "0.25rem" }}>Ethereum addresses must be checksum addresses.</li>
                        </ul>
                    </VStack>
                    <VStack
                        bg={"pageBackground"}
                        px={3}
                        py={2}
                        borderRadius={"16px"}
                        alignItems={"start"}
                        gap={1}
                        color={"textColorMuted"}
                    >
                        <Text color={"textColor"}>{`startDate=YYYY-MM-DD`}</Text>
                        <ul style={{ margin: 0, paddingLeft: "1.5rem", listStyleType: "disc" }}>
                            <li style={{ marginBottom: "0.25rem" }}>The oldest date to fetch data for.</li>
                            <li style={{ marginBottom: "0.25rem" }}>
                                If only the startDate is provided, results for only that date will be returned.
                            </li>
                        </ul>
                    </VStack>
                    <VStack
                        bg={"pageBackground"}
                        px={3}
                        py={2}
                        borderRadius={"16px"}
                        alignItems={"start"}
                        gap={1}
                        color={"textColorMuted"}
                    >
                        <Text color={"textColor"}>{`endDate=YYYY-MM-DD`}</Text>
                        <ul style={{ margin: 0, paddingLeft: "1.5rem", listStyleType: "disc" }}>
                            <li style={{ marginBottom: "0.25rem" }}>Optional.</li>
                            <li style={{ marginBottom: "0.25rem" }}>The newest date to fetch data for.</li>
                        </ul>
                    </VStack>
                </VStack>
                <VStack alignItems={"start"} gap={1}>
                    <Text fontWeight={"bold"}>Example URL</Text>
                    <Link href={apiUrl} target="_blank" textDecoration={"none"} maxW={"500px"}>
                        <Button
                            secondaryButton
                            px={3}
                            py={2}
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
  "ethereumAddresses": [
    "0xE3e34FA93575AF41BEF3476236E1A3CDb3F60B85",
    "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
  ],
  "accounts": [
    {
      "type": "x_username",
      "username": "EridianAlpha"
    },
    {
      "type": "discord_username",
      "username": "eridianalpha#0"
    },
    {
      "type": "farcaster_username",
      "username": "eridian.eth"
    }
  ],
  "totalScores": [
    {
      "day": "${yesterdayString}",
      "totalScore": 90
    },
    {
      "day": "${twoDaysAgoString}",
      "totalScore": 85
    }
  ],
  "signalStrengths": [
    {
      "signalStrengthName": "discourse_forum",
      "data": [
        {
          "day": "${yesterdayString}",
          "value": 90,
          "maxValue": 100,
          "scoreCalculationPeriodPreviousDays": 360
        },
        {
          "day": "${twoDaysAgoString}",
          "value": 85,
          "maxValue": 100,
          "scoreCalculationPeriodPreviousDays": 360
        }
      ]
    },
    {
      "signalStrengthName": "discord",
      "data": [
        {
          "day": "${yesterdayString}",
          "value": 60,
          "maxValue": 100,
          "scoreCalculationPeriodPreviousDays": 360
        },
        {
          "day": "${twoDaysAgoString}",
          "value": 60,
          "maxValue": 100,
          "scoreCalculationPeriodPreviousDays": 360
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
