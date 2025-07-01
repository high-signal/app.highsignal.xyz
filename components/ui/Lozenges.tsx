"use client"

import { HStack, Text } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBell, faEarthAmericas, faHourglassHalf, faLock, faStar } from "@fortawesome/free-solid-svg-icons"
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
        tip: "This feature is currently in development and will be available soon.",
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
        icon: faStar,
        text: "Signal Score",
        tip: "Confirming this account will allow your activity to contribute to your Signal Score.",
    },
}

interface LozengeProps {
    type: LozengeType
    lozengeTypes?: LozengeType[]
}

export function Lozenge({ type, lozengeTypes = [] }: LozengeProps) {
    const config = typeConfig[type]

    let extraTip = ""
    if (lozengeTypes.includes("score") && type === "comingSoon") {
        extraTip =
            "You can confirm this account in advance, but it will not count towards your Signal Score until the feature is launched."
    }

    return (
        <ToggleTip
            content={
                <Text textAlign="center">
                    {config.tip}
                    {extraTip && (
                        <>
                            <br />
                            <br />
                            {extraTip}
                        </>
                    )}
                </Text>
            }
            positioning={{ placement: "top" }}
        >
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
        <HStack flexWrap={"wrap"} gap={2}>
            {types.map((type) => (
                <Lozenge key={type} type={type} lozengeTypes={types} />
            ))}
        </HStack>
    )
}
