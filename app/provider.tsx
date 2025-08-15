"use client"

import { ChakraProvider } from "@chakra-ui/react"
import { ColorModeProvider, type ColorModeProviderProps } from "../components/color-mode/ColorModeProvider"

import GoogleAnalytics from "../components/analytics/GoogleAnalytics"
import "@fortawesome/fontawesome-svg-core/styles.css"

import { systemConfig } from "../styles/theme"
import PrivyProvider from "../components/auth/PrivyProvider"
import { UserProvider } from "../contexts/UserContext"
import { ParticleProvider } from "../contexts/ParticleContext"
import { BannerProvider } from "../contexts/BannerContext"
import { EarlyAccessProvider } from "../contexts/EarlyAccessContext"

export function Provider(props: ColorModeProviderProps) {
    return (
        <ChakraProvider value={systemConfig}>
            <GoogleAnalytics />
            <PrivyProvider>
                <UserProvider>
                    <ColorModeProvider {...props}>
                        <ParticleProvider>
                            <BannerProvider>
                                <EarlyAccessProvider>{props.children}</EarlyAccessProvider>
                            </BannerProvider>
                        </ParticleProvider>
                    </ColorModeProvider>
                </UserProvider>
            </PrivyProvider>
        </ChakraProvider>
    )
}
