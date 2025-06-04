"use client"

import type { ReactNode } from "react"
import dynamic from "next/dynamic"
import { rubik } from "./fonts"
import Head from "./head"
import RootParticleAnimation from "../components/particle-animation/RootParticleAnimation"
import Clarity from "../components/analytics/Clarity"

const isDev = process.env.NODE_ENV === "development"

// Only using server side rendering in production
// In dev, only use client side rendering to avoid hydration errors caused by using --turbo
// https://www.chakra-ui.com/docs/get-started/frameworks/next-app#setup-provider
const Provider = isDev
    ? dynamic(() => import("./provider").then((mod) => mod.Provider), { ssr: false })
    : require("./provider").Provider

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning className={rubik.className}>
            <Head />
            <body suppressHydrationWarning>
                <Provider>
                    <Clarity />
                    {/* <RootParticleAnimation /> Moved to EarlyAccessContext for now */}
                    {children}
                </Provider>
            </body>
        </html>
    )
}
