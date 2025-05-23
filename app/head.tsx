import { ASSETS } from "../config/constants"

export default function Head() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME
    const siteDescription = process.env.NEXT_PUBLIC_SITE_DESCRIPTION

    return (
        <head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

            {/* Mobile browser header color */}
            <meta name="theme-color" content={"colors.pageBackground"} media="(prefers-color-scheme: light)" />
            <meta name="theme-color" content={"colors.pageBackground"} media="(prefers-color-scheme: dark)" />

            {/* Link to PWA manifest */}
            <link rel="manifest" href="/api/manifest.json" />

            {/* iOS-specific meta tags for PWA */}
            <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
            <link
                rel="apple-touch-icon"
                href={`${ASSETS.LOGO_BASE_URL}${process.env.NODE_ENV === "development" ? "/e_colorize:50,co_rgb:FF5400/w_300,h_300,c_fill,q_auto,f_webp/" : "/w_300,h_300,c_fill,q_auto,f_webp/"}${ASSETS.LOGO_ID}`}
            />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="apple-mobile-web-app-title" content={siteName} />

            {/* Favicon & Icons */}
            <link rel="icon" href="/static/logo/favicon.ico" sizes="any" />

            {/* Title & Meta Description */}
            <title>{siteName}</title>
            <meta name="description" content={siteDescription} />

            {/* Open Graph */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={siteName} />
            <meta property="og:description" content={siteDescription} />
            <meta property="og:image" content={`${baseUrl}/static/logo.svg`} />
            <meta property="og:url" content={baseUrl} />
            <meta property="og:site_name" content={siteName} />
            <meta property="og:locale" content="en_US" />

            {/* Twitter Cards */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={siteName} />
            <meta name="twitter:description" content={siteDescription} />
            <meta name="twitter:image" content={`${baseUrl}/static/logo.svg`} />

            {/* Canonical URL */}
            <link rel="canonical" href={baseUrl} />

            {/* Robots */}
            <meta name="robots" content="index, follow" />
        </head>
    )
}
