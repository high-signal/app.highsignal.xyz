"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { VStack, Text, Button, Spinner, Menu, Portal, HStack, Box, Switch } from "@chakra-ui/react"
import { toaster } from "../ui/toaster"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEllipsisVertical, faSignOut } from "@fortawesome/free-solid-svg-icons"

import { usePrivy } from "@privy-io/react-auth"

import SettingsInputField from "../ui/SettingsInputField"
import SettingsSectionContainer from "../ui/SettingsSectionContainer"
import SingleLineTextInput from "../ui/SingleLineTextInput"

interface SignalStrengthRowProps {
    title: string
    value: string
    onChange: () => void
    onKeyDown: () => void
    isEnabled?: boolean
}

function SignalStrengthRow({ title, value, onChange, onKeyDown, isEnabled = true }: SignalStrengthRowProps) {
    return (
        <HStack justify="space-between" w={"100%"}>
            <Text w={"200px"} fontWeight="bold" fontSize="lg" whiteSpace="nowrap">
                {title}
            </Text>
            <HStack justifyContent={"start"} w={"100px"}>
                <SingleLineTextInput value={value} onChange={onChange} onKeyDown={onKeyDown} isEditable={true} />
                <Text whiteSpace="nowrap">/ 100</Text>
            </HStack>
            <Switch.Root defaultChecked={isEnabled}>
                <Switch.HiddenInput />
                <Switch.Control>
                    <Switch.Thumb />
                </Switch.Control>
                <Switch.Label />
            </Switch.Root>
        </HStack>
    )
}

export default function SignalStrengthProjectSettingsContainer({}: {}) {
    const { getAccessToken } = usePrivy()
    const router = useRouter()

    return (
        <SettingsSectionContainer title="Signal Strength Settings">
            <Text color="gray.500">🏗️ Under development 🏗️</Text>
            <SignalStrengthRow
                title="Forum Engagement"
                value="30"
                onChange={() => {}}
                onKeyDown={() => {}}
                isEnabled={true}
            />
            <SignalStrengthRow
                title="Discord Engagement
"
                value="20"
                onChange={() => {}}
                onKeyDown={() => {}}
                isEnabled={false}
            />
            <SignalStrengthRow
                title="Protocol Engagement
"
                value="60"
                onChange={() => {}}
                onKeyDown={() => {}}
                isEnabled={false}
            />
        </SettingsSectionContainer>
    )
}
