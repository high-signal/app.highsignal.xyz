"use client"

import { PrivyProvider as PrivyAuthProvider } from "@privy-io/react-auth"
import { ReactNode } from "react"

import { ASSETS } from "../../config/constants"

interface PrivyProviderProps {
    children: ReactNode
}

export default function PrivyProvider({ children }: PrivyProviderProps) {
    return (
        <PrivyAuthProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
            config={{
                loginMethods: ["email", "wallet", "twitter", "discord", "google", "github", "farcaster"],
                appearance: {
                    logo: `${ASSETS.LOGO_BASE_URL}/w_300,h_300,c_fill,q_auto,f_webp/${ASSETS.LOGO_ID}`,
                    landingHeader: "High Signal",
                    loginMessage: "Sign in or create an account",
                    theme: "#012F52",
                    accentColor: "#89d5e0",
                    walletChainType: "ethereum-only",
                },
            }}
        >
            {children}
        </PrivyAuthProvider>
    )
}
