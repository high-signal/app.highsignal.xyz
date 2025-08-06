"use client"

import { HStack, Text, VStack } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
    faBell,
    faEarthAmericas,
    faHourglassHalf,
    faLock,
    faChartLine,
    faShare,
    faInfoCircle,
} from "@fortawesome/free-solid-svg-icons"
import { ToggleTip } from "./toggle-tip"

const typeConfig = {
    private: {
        bgColor: "blue.800",
        color: "blue.100",
        icon: faLock,
        text: "Private",
        tip: "This information is private and is not visible to other users or projects.",
    },
    public: {
        bgColor: "green.500",
        color: "white",
        icon: faEarthAmericas,
        text: "Public",
        tip: "This information is public and can be seen by anyone.",
    },
    shared_address: {
        bgColor: "teal.500",
        color: "white",
        icon: faShare,
        text: "Shared",
        tip: "You have chosen to share this address with the projects listed below. Only the address is shared, not any custom name you have set.",
    },
    shared_account: {
        bgColor: "teal.500",
        color: "white",
        icon: faShare,
        text: "Shared",
        tip: "You have chosen to share this account with the projects listed below. Only the account username is shared.",
    },
    comingSoon: {
        bgColor: "blue.700",
        color: "blue.100",
        icon: faHourglassHalf,
        text: "Coming Soon",
        tip: "This feature is currently in development and will be available soon. You can confirm this account now, but it will not count towards your Signal Score until the feature is launched.",
    },
    notifications: {
        bgColor: "gold.500",
        color: "gold.950",
        icon: faBell,
        text: "Notifications",
        tip: "Confirming this account will allow you to receive notifications from High Signal.",
    },
    score: {
        bgColor: "green.500",
        color: "white",
        icon: faChartLine,
        text: "Signal Score",
        tip: "When confirmed, your activity on these accounts will contribute to your Signal Score.",
    },
    calcInfo: {
        bgColor: "blue.500",
        color: "blue.100",
        icon: faInfoCircle,
        text: "",
        tip: (
            <VStack p={1} textAlign="center" gap={5} fontSize="md">
                <Text>
                    Scores are updated daily and use your activity from yesterday, as well as a number of previous days.
                </Text>
                <HStack w="100%" justifyContent="space-around">
                    <Text>🗓️</Text>
                    <Text>⏳</Text>
                    <Text>🗓️</Text>
                    <Text>⏳</Text>
                    <Text>🗓️</Text>
                    <Text>⏳</Text>
                </HStack>
                <Text>If your score has not yet been updated, come back tomorrow to see your new daily score.</Text>
            </VStack>
        ),
    },
}

interface LozengeProps {
    type: LozengeType
    lozengeTypes?: LozengeType[]
}

export function Lozenge({ type, lozengeTypes = [] }: LozengeProps) {
    const config = typeConfig[type]
    const iconOnly = !config.text

    return (
        <ToggleTip
            content={typeof config.tip === "string" ? <Text textAlign="center">{config.tip}</Text> : config.tip}
            positioning={{ placement: "top" }}
        >
            <HStack
                fontSize="sm"
                color={config.color}
                cursor="pointer"
                gap={"6px"}
                bg={config.bgColor}
                borderRadius="full"
                px={iconOnly ? "5px" : 2}
                py={iconOnly ? "5px" : "1px"}
            >
                <FontAwesomeIcon icon={config.icon} />
                {!iconOnly && <Text>{config.text}</Text>}
            </HStack>
        </ToggleTip>
    )
}

interface LozengesProps {
    types: LozengeType[]
}

export function Lozenges({ types }: LozengesProps) {
    return (
        <HStack flexWrap={"wrap-reverse"} gap={2} justifyContent="flex-end">
            {types.map((type) => (
                <Lozenge key={type} type={type} lozengeTypes={types} />
            ))}
        </HStack>
    )
}
