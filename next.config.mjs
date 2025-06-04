export default {
    trailingSlash: true, // Keeps URLs with a trailing slash (e.g., /about/ instead of /about)
    reactStrictMode: true, // Enables React's strict mode for better debugging

    experimental: {
        optimizePackageImports: ["@chakra-ui/react"], // Optimizes Chakra UI imports to reduce bundle size
    },
    // Commented out as it is not needed for the project but Privy said it might be needed at some point
    // webpack: (config) => {
    //     config.externals["@solana/web3.js"] = "commonjs @solana/web3.js"
    //     return config
    // },

    // Add Content Security Policy headers
    async headers() {
        // Get the site URL from environment variables
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
        // Extract the domain and protocol from the URL
        const url = new URL(siteUrl)
        const domain = url.hostname
        const protocol = url.protocol.replace(":", "")

        return [
            {
                source: "/:path*",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: `
                            default-src 'self';
                            script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com ${protocol}://*.${domain} https://www.clarity.ms https://c.bing.com https://www.googletagmanager.com;
                            style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
                            img-src 'self' data: blob: https://*.cloudinary.com https://c.clarity.ms https://c.bing.com;
                            font-src 'self' https://fonts.gstatic.com;
                            object-src 'none';
                            base-uri 'self';
                            form-action 'self';
                            frame-ancestors 'none';
                            child-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org;
                            frame-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://challenges.cloudflare.com;
                            connect-src 'self' https://auth.privy.io https://*.privy.io wss://relay.walletconnect.com wss://relay.walletconnect.org wss://www.walletlink.org https://*.rpc.privy.systems ${protocol}://*.${domain} https://explorer-api.walletconnect.com https://pulse.walletconnect.org https://api.web3modal.org https://*.web3modal.org https://*.walletconnect.org https://*.walletconnect.com https://*.cloudinary.com https://c.bing.com https://o.clarity.ms https://*.google-analytics.com https://region1.google-analytics.com https://www.google-analytics.com;
                            worker-src 'self';
                            manifest-src 'self'
                        `
                            .replace(/\s+/g, " ")
                            .trim(),
                    },
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                ],
            },
        ]
    },
}
