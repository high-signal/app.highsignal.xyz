import { NextResponse } from "next/server"

import { COLORS, ASSETS } from "../../../config/constants"

export async function GET() {
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME
    const logoPath = ASSETS.LOGO

    const manifest = {
        name: siteName,
        short_name: siteName,
        start_url: "/",
        display: "standalone",
        background_color: COLORS.PAGE_BACKGROUND_DARK,
        theme_color: COLORS.PAGE_BACKGROUND_DARK,
        orientation: "portrait",
        icons: [
            {
                src: logoPath,
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: logoPath,
                sizes: "512x512",
                type: "image/png",
            },
        ],
    }

    return NextResponse.json(manifest, {
        headers: {
            "Content-Type": "application/manifest+json",
        },
    })
}
