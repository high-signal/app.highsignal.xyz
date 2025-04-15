"use client"

import { ChakraProvider } from "@chakra-ui/react"
import { ColorModeProvider, type ColorModeProviderProps } from "../components/color-mode/ColorModeProvider"

import GoogleAnalytics from "../components/analytics/GoogleAnalytics"
import "@fortawesome/fontawesome-svg-core/styles.css"

import { customConfig } from "../styles/theme"
import PrivyProvider from "../components/auth/PrivyProvider"
import { UserProvider } from "../contexts/UserContext"

export function Provider(props: ColorModeProviderProps) {
    return (
        <ChakraProvider value={customConfig}>
            <GoogleAnalytics />
            <PrivyProvider>
                <UserProvider>
                    <ColorModeProvider {...props} />
                </UserProvider>
            </PrivyProvider>
        </ChakraProvider>
    )
}
