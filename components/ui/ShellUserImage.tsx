"use client"

import { Box, HStack } from "@chakra-ui/react"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faDiscord, faDiscourse } from "@fortawesome/free-brands-svg-icons"
import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons"

export default function ShellUserImage({
    type,
    boxSize,
    iconSize = "lg",
}: {
    type: string
    boxSize?: string | number | { [breakpoint: string]: string | number }
    iconSize?: string
}) {
    let icon = faCircleQuestion

    if (type === "discord_user") {
        icon = faDiscord
    } else if (type === "discourse_forum_user") {
        icon = faDiscourse
    }

    return (
        <HStack
            justifyContent={"center"}
            alignItems={"center"}
            textAlign="center"
            w={"100%"}
            h={"100%"}
            bg={"contentBackground"}
            color={"textColorMuted"}
            border={"2px dashed"}
            borderRadius={"full"}
            borderColor={"textColorMuted"}
            opacity={0.6}
            {...(boxSize !== undefined ? { boxSize, minW: boxSize, maxW: boxSize, minH: boxSize, maxH: boxSize } : {})}
        >
            <Box fontSize={iconSize}>
                <FontAwesomeIcon icon={icon} />
            </Box>
        </HStack>
    )
}
