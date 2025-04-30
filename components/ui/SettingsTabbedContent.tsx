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
            <Tabs.Root defaultValue={defaultValue} variant={"outline"} w={"100%"}>
                <Box display="flex" justifyContent="center" w="100%">
                    <Tabs.List w={listWidth}>
                        {tabs.map((tab) => (
                            <Tabs.Trigger key={tab.value} value={tab.value} fontSize={"md"}>
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
