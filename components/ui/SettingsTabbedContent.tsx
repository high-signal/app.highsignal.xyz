"use client"

import { Box, Text } from "@chakra-ui/react"
import { Tabs } from "@chakra-ui/react"
import { ReactNode } from "react"

interface TabItem {
    value: string
    label: string
    content: ReactNode
}

interface SettingsTabbedContentProps {
    defaultValue: string
    tabs: TabItem[]
    listWidth?: string
    title: string
}

export default function SettingsTabbedContent({
    defaultValue,
    tabs,
    listWidth = "500px",
    title,
}: SettingsTabbedContentProps) {
    return (
        <>
            <Text fontSize="3xl" fontWeight="bold" pt={5}>
                {title}
            </Text>
            <Tabs.Root lazyMount unmountOnExit defaultValue={defaultValue} variant={"enclosed"} w={"100%"}>
                <Box display="flex" justifyContent="center" w="100%">
                    <Tabs.List w={listWidth} bg={"contentBackground"} borderRadius={"10px"} gap={2} p={2}>
                        {tabs.map((tab) => (
                            <Tabs.Trigger
                                key={tab.value}
                                value={tab.value}
                                fontSize={"md"}
                                bg={"pageBackground"}
                                boxShadow={"none"}
                                borderRadius={"8px"}
                                _hover={{
                                    bg: "button.hover",
                                    _active: { bg: "button.active" },
                                    _selected: { bg: "button.active" },
                                }}
                                _selected={{ bg: "button.active", color: "textColor" }}
                                _active={{ bg: "button.active" }}
                            >
                                {tab.label}
                            </Tabs.Trigger>
                        ))}
                    </Tabs.List>
                </Box>
                {tabs.map((tab) => (
                    <Tabs.Content key={tab.value} value={tab.value} w={"100%"}>
                        {tab.content}
                    </Tabs.Content>
                ))}
            </Tabs.Root>
        </>
    )
}
