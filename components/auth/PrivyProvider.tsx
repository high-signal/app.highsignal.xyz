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
                loginMethods: ["email", "wallet"],
                appearance: {
                    theme: "dark",
                    accentColor: "#141414",
                },
            }}
        >
            {children}
        </PrivyAuthProvider>
    )
}
