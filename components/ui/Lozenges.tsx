"use client"

import { HStack, Text } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBell, faEarthAmericas, faHourglassHalf, faLock, faChartLine } from "@fortawesome/free-solid-svg-icons"
import { ToggleTip } from "./toggle-tip"

const typeConfig = {
    private: {
        bgColor: "blue.800",
        color: "blue.100",
        icon: faLock,
        text: "Private",
        tip: "This information is private and is not visible to other users.",
    },
    public: {
        bgColor: "green.500",
        color: "textColor",
        icon: faEarthAmericas,
        text: "Public",
        tip: "This information is public and can be seen by anyone.",
    },
    comingSoon: {
        bgColor: "blue.500",
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
        color: "green.100",
        icon: faChartLine,
        text: "Signal Score",
        tip: "When confirmed, your activity on these accounts will contribute to your Signal Score.",
    },
}

interface LozengeProps {
    type: LozengeType
    lozengeTypes?: LozengeType[]
}

export function Lozenge({ type, lozengeTypes = [] }: LozengeProps) {
    const config = typeConfig[type]

    return (
        <ToggleTip content={<Text textAlign="center">{config.tip}</Text>} positioning={{ placement: "top" }}>
            <HStack
                fontSize="sm"
                color={config.color}
                cursor="pointer"
                gap={"6px"}
                bg={config.bgColor}
                borderRadius="full"
                px={2}
                py={"1px"}
            >
                <FontAwesomeIcon icon={config.icon} />
                <Text>{config.text}</Text>
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
