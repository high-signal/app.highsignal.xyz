"use client"

import { PrivyProvider as PrivyAuthProvider } from "@privy-io/react-auth"
import { ReactNode } from "react"

interface PrivyProviderProps {
    children: ReactNode
}

export default function PrivyProvider({ children }: PrivyProviderProps) {
    return (
        <PrivyAuthProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
            config={{
                loginMethods: ["email", "wallet", "twitter", "discord", "google", "github", "farcaster", "passkey"],
                appearance: {
                    // logo: "/static/logo/logo.png",
                    landingHeader: "High Signal",
                    loginMessage: "Sign in or create an account",
                    theme: "dark",
                    accentColor: "#A6A6A6",
                    walletChainType: "ethereum-only",
                },
            }}
        >
            {children}
        </PrivyAuthProvider>
    )
}
