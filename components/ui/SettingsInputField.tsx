"use client"

import { VStack, Text, HStack } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBell, faEarthAmericas, faHourglassHalf, faLock, faStar } from "@fortawesome/free-solid-svg-icons"
import SingleLineTextInput from "./SingleLineTextInput"
import { ReactNode } from "react"
import { ToggleTip } from "./toggle-tip"

interface SettingsInputFieldProps {
    label: string
    labelIcon?: ReactNode
    description: string
    value: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
    error?: string
    rightElement?: ReactNode
    isEditable?: boolean
    inputReplacement?: ReactNode
    h?: string
    lozengeTypes?: ("public" | "private" | "comingSoon" | "notifications" | "score")[]
}

export default function SettingsInputField({
    label,
    labelIcon,
    description,
    value,
    onChange,
    onKeyDown,
    error,
    rightElement,
    isEditable = true,
    inputReplacement,
    h = "35px",
    lozengeTypes = [],
}: SettingsInputFieldProps) {
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

    const Lozenge = ({ type }: { type: keyof typeof typeConfig }) => {
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

    return (
        <VStack
            align="stretch"
            w="100%"
            border="2px solid"
            borderColor="contentBorder"
            borderRadius="16px"
            p={3}
            bg={"pageBackground"}
            gap={1}
        >
            <HStack justify="space-between" px={2} pb={labelIcon ? 2 : 1} flexWrap={"wrap"} gap={2}>
                <HStack>
                    {labelIcon}
                    <Text fontWeight="bold">{label}</Text>
                </HStack>
                <HStack flexWrap={"wrap"} gap={2}>
                    {lozengeTypes.map((type) => (
                        <Lozenge key={type} type={type} />
                    ))}
                </HStack>
            </HStack>
            <HStack w="100%" gap={0} bg={"pageBackground"} h={h}>
                {inputReplacement ? (
                    inputReplacement
                ) : (
                    <SingleLineTextInput
                        value={value}
                        onChange={onChange}
                        onKeyDown={onKeyDown}
                        rightElement={rightElement}
                        isEditable={isEditable}
                    />
                )}
                {rightElement}
            </HStack>
            {error ? (
                <Text color="orange.700" fontSize="sm" px={2}>
                    {error}
                </Text>
            ) : (
                description && (
                    <Text fontSize="sm" color="gray.500" px={2}>
                        {description}
                    </Text>
                )
            )}
        </VStack>
    )
}
