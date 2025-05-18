"use client"

import { Box, Text } from "@chakra-ui/react"
import { Tabs } from "@chakra-ui/react"
import { ReactNode } from "react"
import { useSearchParams } from "next/navigation"

interface TabItem {
    value: string
    label: string
    content: ReactNode
}

interface SettingsTabbedContentProps {
    tabs: TabItem[]
    listWidth?: string
    title: string
}

export default function SettingsTabbedContent({ tabs, listWidth = "500px", title }: SettingsTabbedContentProps) {
    const searchParams = useSearchParams()
    const tabParam = searchParams.get("tab")
    const defaultTab = tabParam && tabs.some((tab) => tab.value === tabParam) ? tabParam : tabs[0].value

    return (
        <>
            <Text fontSize="3xl" fontWeight="bold" pt={5}>
                {title}
            </Text>
            <Tabs.Root lazyMount unmountOnExit defaultValue={defaultTab} variant={"enclosed"} w={"100%"}>
                <Box display="flex" justifyContent="center" w="100%">
                    <Tabs.List
                        minW={{ base: "100%", sm: `min(${listWidth}, 100%)` }}
                        bg={"contentBackground"}
                        borderRadius={{ base: 0, sm: "16px" }}
                        gap={2}
                        p={2}
                        mx={{ base: 0, sm: 2 }}
                        flexWrap={"wrap"}
                        justifyContent={{ base: "center", sm: "start" }}
                    >
                        {tabs.map((tab) => (
                            <Tabs.Trigger
                                key={tab.value}
                                value={tab.value}
                                fontSize={"md"}
                                bg={"pageBackground"}
                                boxShadow={"none"}
                                borderRadius={"8px"}
                                _hover={{
                                    bg: "button.secondary.hover",
                                    color: "textColor",
                                }}
                                _selected={{
                                    bg: "button.secondary.active",
                                    _hover: { bg: "button.secondary.active" },
                                    color: "textColor",
                                }}
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
