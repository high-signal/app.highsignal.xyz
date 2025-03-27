export default {
    trailingSlash: true, // Keeps URLs with a trailing slash (e.g., /about/ instead of /about)
    reactStrictMode: true, // Enables React's strict mode for better debugging

    experimental: {
        optimizePackageImports: ["@chakra-ui/react"], // Optimizes Chakra UI imports to reduce bundle size
    },
}
