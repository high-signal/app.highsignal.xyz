import { createSystem, defaultConfig } from "@chakra-ui/react"

// Color Palette
// https://javisperez.github.io/tailwindcolorshades/?corn=e7c60d&curious-blue=36A2EB&pomegranate=EC420C&malachite=00B800

export const customConfig = createSystem(defaultConfig, {
    theme: {
        tokens: {
            colors: {
                blue: {
                    50: { value: "#F5FDFF" },
                    100: { value: "#E8F8FC" },
                    200: { value: "#CAEEFA" },
                    300: { value: "#ABE2F7" },
                    400: { value: "#6EC5F0" },
                    500: { value: "#36A2EB" },
                    600: { value: "#2C8BD4" },
                    700: { value: "#1E69B0" },
                    800: { value: "#144E8C" },
                    900: { value: "#0A3369" },
                    950: { value: "#051D45" },
                },
                red: {
                    50: { value: "#FFFAF2" },
                    100: { value: "#FCF3E6" },
                    200: { value: "#FADDBE" },
                    300: { value: "#F7C599" },
                    400: { value: "#F28A52" },
                    500: { value: "#5f2413" },
                    600: { value: "#D6370B" },
                    700: { value: "#B32907" },
                    800: { value: "#8F1E04" },
                    900: { value: "#6B1402" },
                    950: { value: "#450B01" },
                },
                green: {
                    50: { value: "#F0FCF6" },
                    100: { value: "#DFF7EA" },
                    200: { value: "#B2EDC9" },
                    300: { value: "#88E3A3" },
                    400: { value: "#3DCC53" },
                    500: { value: "#142B14" },
                    600: { value: "#00A600" },
                    700: { value: "#008A00" },
                    800: { value: "#006E00" },
                    900: { value: "#005200" },
                    950: { value: "#003600" },
                },
                gold: {
                    50: { value: "#FFFEF2" },
                    100: { value: "#FCFBE6" },
                    200: { value: "#FAF4C0" },
                    300: { value: "#F5EB98" },
                    400: { value: "#F0DB51" },
                    500: { value: "#e7c60d" },
                    600: { value: "#D1A90A" },
                    700: { value: "#AD8407" },
                    800: { value: "#8C6206" },
                    900: { value: "#694203" },
                    950: { value: "#422501" },
                },
                orange: { value: "#FFA500" },
            },
            fonts: {
                body: { value: "'Rubik', sans-serif" },
            },
        },
        semanticTokens: {
            colors: {
                textColor: {
                    value: { _light: "black", _dark: "#EDEEF0" },
                },
                pageBackground: {
                    value: { _light: "#FFFFFF", _dark: "#000000" },
                },
                contentBackground: {
                    value: { _light: "#EDF2F7", _dark: "#041524" },
                },
                contentBackgroundHover: {
                    value: { _light: "#E2E8F0", _dark: "#2D3748" },
                },
                contentBorder: {
                    value: { _light: "#EDF2F7", _dark: "#008C8B" },
                },
                particleColor: {
                    value: { _light: "#0da6d8", _dark: "#25B8FF" },
                },
            },
        },
    },
    globalCss: {
        "html, body": {
            backgroundColor: "{colors.contentBackground}",
            backgroundImage: "linear-gradient(45deg, {colors.pageBackground} 20%,hsl(210, 3.20%, 24.30%) 120%)",
            fontFamily: "fonts.body",
        },
    },
})
