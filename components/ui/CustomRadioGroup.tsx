"use client"

import { RadioGroup, Box, Text, HStack } from "@chakra-ui/react"
import { faArrowRight } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

export function CustomRadioItem({
    option,
}: {
    option: {
        selected: boolean
        value: string
        text: string
        bgColor: string
        borderColor: string
        textColor: string
        itemBackground: string
    }
}) {
    return (
        <RadioGroup.Item
            value={option.value}
            cursor={"pointer"}
            gap={0}
            bg={option.itemBackground}
            borderRadius={"full"}
            flexGrow={1}
        >
            <RadioGroup.ItemHiddenInput />
            <Box w={"28px"} pl={"2px"} h={"100%"} display={"flex"} alignItems={"center"} justifyContent={"center"}>
                {option.selected && <FontAwesomeIcon icon={faArrowRight} />}
            </Box>
            <RadioGroup.ItemText flexGrow={1}>
                <HStack
                    bg={option.bgColor}
                    px={2}
                    py={1}
                    borderRadius={"full"}
                    border={"2px solid"}
                    borderColor={option.borderColor}
                    fontWeight={"bold"}
                    fontSize={"sm"}
                    w={"100%"}
                    justifyContent={"center"}
                >
                    <Text color={option.textColor}>{option.text}</Text>
                </HStack>
            </RadioGroup.ItemText>
        </RadioGroup.Item>
    )
}
