import type { ReactNode } from "react"

import { ThemeProvider } from "next-themes"
import { Provider } from "./provider"
import { rubik } from "./fonts"

import Head from "./head"

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning className={rubik.className}>
            <Head />
            <body suppressHydrationWarning>
                <ThemeProvider attribute="class">
                    <Provider>{children}</Provider>
                </ThemeProvider>
            </body>
        </html>
    )
}
