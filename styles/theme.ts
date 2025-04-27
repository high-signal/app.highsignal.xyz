import { createSystem, defaultConfig } from "@chakra-ui/react"
import { keyframes } from "@emotion/react"

// Color Palette
// https://javisperez.github.io/tailwindcolorshades/?corn=e7c60d&curious-blue=36A2EB&pomegranate=EC420C&malachite=00B800

const rainbowAnimation = keyframes`
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
        `

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
                    50: { value: "#F7F3ED" },
                    100: { value: "#F0E7DD" },
                    200: { value: "#D6C1AB" },
                    300: { value: "#BF9E82" },
                    400: { value: "#8F593F" },
                    500: { value: "#5f2413" },
                    600: { value: "#541D0F" },
                    700: { value: "#47160B" },
                    800: { value: "#380F07" },
                    900: { value: "#2B0A04" },
                    950: { value: "#1C0502" },
                },
                green: {
                    50: { value: "#F1F5ED" },
                    100: { value: "#E4EBDF" },
                    200: { value: "#B9C9AF" },
                    300: { value: "#92AB87" },
                    400: { value: "#496B43" },
                    500: { value: "#142B14" },
                    600: { value: "#102610" },
                    700: { value: "#0C210C" },
                    800: { value: "#071A07" },
                    900: { value: "#041404" },
                    950: { value: "#020D02" },
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
                orange: {
                    50: { value: "#FFFBF2" },
                    100: { value: "#FFF6E6" },
                    200: { value: "#FFE4BF" },
                    300: { value: "#FFCF99" },
                    400: { value: "#FF9A4D" },
                    500: { value: "#FF5400" },
                    600: { value: "#E64900" },
                    700: { value: "#BF3900" },
                    800: { value: "#992900" },
                    900: { value: "#731D00" },
                    950: { value: "#4A1000" },
                },
            },
            fonts: {
                body: { value: "'Rubik', sans-serif" },
            },
        },
        semanticTokens: {
            colors: {
                textColor: {
                    value: { _light: "black", _dark: "{colors.gray.400}" },
                },
                pageBackground: {
                    value: { _light: "#FFFFFF", _dark: "#0A0A0A" },
                },
                contentBackground: {
                    value: { _light: "#EDF2F7", _dark: "#141414" },
                },
                contentBackgroundHover: {
                    value: { _light: "#E2E8F0", _dark: "#2D3748" },
                },
                contentBorder: {
                    value: { _light: "#EDF2F7", _dark: "#008C8B" },
                },
                scoreColor: {
                    high: {
                        value: { _light: "{colors.orange.500}", _dark: "{colors.orange.500}" },
                    },
                    mid: {
                        value: { _light: "{colors.blue.400}", _dark: "{colors.blue.800}" },
                    },
                    low: {
                        value: { _light: "{colors.gray.400}", _dark: "{colors.gray.400}" },
                    },
                },
            },
        },
    },
    globalCss: {
        "html, body": {
            backgroundColor: "{colors.pageBackground}",
            height: "100dvh",
            width: "100vw",
            overflowX: "hidden",
            fontFamily: "fonts.body",
        },
        ".rainbow-animation": {
            backgroundImage: "linear-gradient(270deg, pink, purple, blue, red, blue, purple, pink) !important",
            backgroundSize: "1000% 1000% !important",
            textShadow: "0px 0px 5px black !important",
            animation: `${rainbowAnimation} 20s linear infinite !important`,
        },
    },
})
