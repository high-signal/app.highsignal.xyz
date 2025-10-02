import { createSystem, defaultConfig, defineConfig, defineRecipe } from "@chakra-ui/react"
import { keyframes } from "@emotion/react"
import { buttonRecipe } from "./button"

import { COLORS } from "../config/constants"

// Color Palette
// https://javisperez.github.io/tailwindcolorshades

const rainbowAnimation = keyframes`
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
        `

const pulseShadow = keyframes`
    0% { box-shadow: 0 0 10px 0px green; }
    50% { box-shadow: 0 0 20px 5px green; }
    100% { box-shadow: 0 0 10px 0px green; }
  }
`

const borderColorAnimation = keyframes`
  0% { border-color: pink; }
  20% { border-color: purple; }
  40% { border-color: blue; }
  60% { border-color: red; }
  80% { border-color: blue; }
  100% { border-color: pink; }
`

// Run this command when adding a new variant to fix the type error:
// npx @chakra-ui/cli typegen ./styles/theme.ts

export const customConfig = defineConfig({
    theme: {
        tokens: {
            colors: {
                blue: {
                    50: { value: "#F0FBFC" },
                    100: { value: "#DFF4F7" },
                    200: { value: "#B2E5ED" },
                    300: { value: "#87D3E0" },
                    400: { value: "#3FB2CC" },
                    500: { value: "#028DB4" },
                    600: { value: "#027BA3" },
                    700: { value: "#015D87" },
                    800: { value: "#01466E" },
                    900: { value: "#012F52" },
                    950: { value: COLORS.PAGE_BACKGROUND_DARK }, // Used in PWA config
                },
                red: {
                    50: { value: "#FFFAF2" },
                    100: { value: "#FCF3E6" },
                    200: { value: "#FADDBE" },
                    300: { value: "#F7C599" },
                    400: { value: "#F28A52" },
                    500: { value: "#EC420C" },
                    600: { value: "#D6370B" },
                    700: { value: "#B32907" },
                    800: { value: "#8F1E04" },
                    900: { value: "#6B1402" },
                    950: { value: "#450B01" },
                },
                green: {
                    50: { value: "#EDFAF3" },
                    100: { value: "#DCF5E7" },
                    200: { value: "#AEE8C4" },
                    300: { value: "#82D99C" },
                    400: { value: "#3ABA4D" },
                    500: { value: "#029E03" },
                    600: { value: "#018F01" },
                    700: { value: "#017501" },
                    800: { value: "#015E01" },
                    900: { value: "#004700" },
                    950: { value: "#002E00" },
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
                teal: {
                    50: { value: "#f0fbfc" },
                    100: { value: "#dff5f7" },
                    200: { value: "#b4e7ed" },
                    300: { value: "#89d5e0" },
                    400: { value: "#41b7cc" },
                    500: { value: "#0697b6" },
                    600: { value: "#0581a3" },
                    700: { value: "#036287" },
                    800: { value: "#02486e" },
                    900: { value: "#013152" },
                    950: { value: "#011d36" },
                },
            },
            fonts: {
                body: { value: "'Rubik', sans-serif" },
            },
        },
        semanticTokens: {
            colors: {
                // Text colors
                textColor: {
                    value: { _light: "black", _dark: "white" },
                },
                textColorMuted: {
                    value: { _light: "{colors.gray.500}", _dark: "{colors.gray.400}" },
                },
                selectionColor: {
                    value: { _light: "{colors.blue.300}", _dark: "{colors.teal.600}" },
                },

                // Particle colors
                particleColor: {
                    value: { _light: "{colors.teal.400}", _dark: "{colors.teal.700}" },
                },

                // Background colors
                pageBackground: {
                    value: { _light: "{colors.blue.100}", _dark: "{colors.blue.950}" },
                },
                pageBackgroundMuted: {
                    value: {
                        _light: "color-mix(in srgb, {colors.blue.100} 60%, transparent)",
                        _dark: "color-mix(in srgb, {colors.blue.950} 60%, transparent)",
                    },
                },
                contentBackground: {
                    value: { _light: "{colors.blue.200}", _dark: "{colors.blue.900}" },
                },
                contentBackgroundHover: {
                    value: { _light: "{colors.blue.300}", _dark: "{colors.blue.800}" },
                },

                // Border colors
                contentBorder: {
                    value: { _light: "{colors.blue.400}", _dark: "{colors.teal.700}" },
                },

                // Button colors
                button: {
                    primary: {
                        default: {
                            value: { _light: "{colors.orange.500}", _dark: "{colors.orange.500}" },
                        },
                        hover: {
                            value: { _light: "{colors.orange.400}", _dark: "{colors.orange.600}" },
                        },
                        active: {
                            value: { _light: "{colors.orange.500}", _dark: "{colors.orange.700}" },
                        },
                    },
                    secondary: {
                        default: {
                            value: { _light: "{colors.teal.300}", _dark: "{colors.teal.800}" },
                        },
                        hover: {
                            value: { _light: "{colors.teal.400}", _dark: "{colors.teal.700}" },
                        },
                        active: {
                            value: { _light: "{colors.teal.300}", _dark: "{colors.teal.800}" },
                        },
                    },
                    success: {
                        default: {
                            value: { _light: "{colors.green.500}", _dark: "{colors.green.950}" },
                        },
                        hover: {
                            value: { _light: "{colors.green.400}", _dark: "{colors.green.900}" },
                        },
                        active: {
                            value: { _light: "{colors.green.500}", _dark: "{colors.green.900}" },
                        },
                    },
                    danger: {
                        default: {
                            value: { _light: "{colors.red.500}", _dark: "{colors.red.700}" },
                        },
                        hover: {
                            value: { _light: "{colors.red.400}", _dark: "{colors.red.600}" },
                        },
                        active: {
                            value: { _light: "{colors.red.500}", _dark: "{colors.red.700}" },
                        },
                    },
                    closeButton: {
                        default: {
                            value: { _light: "{colors.gray.400}", _dark: "{colors.gray.300}" },
                        },
                        hover: {
                            value: { _light: "black", _dark: "white" },
                        },
                        active: {
                            value: { _light: "{colors.gray.400}", _dark: "{colors.gray.300}" },
                        },
                    },
                },

                // Input colors
                input: {
                    border: {
                        value: { _light: "{colors.blue.400}", _dark: "{colors.blue.500}" },
                    },
                    borderHover: {
                        value: { _light: "{colors.blue.500}", _dark: "{colors.blue.700}" },
                    },
                    background: {
                        value: { _light: "{colors.blue.400}", _dark: "{colors.blue.500}" },
                    },
                },

                // Score colors
                scoreColor: {
                    high: {
                        value: { _light: "{colors.green.500}", _dark: "{colors.green.500}" },
                    },
                    mid: {
                        value: { _light: "{colors.teal.500}", _dark: "{colors.teal.500}" },
                    },
                    low: {
                        value: { _light: "{colors.gray.400}", _dark: "{colors.gray.400}" },
                    },
                },

                // Lozenge colors
                lozenge: {
                    background: {
                        active: {
                            value: { _light: "{colors.green.500}", _dark: "{colors.green.950}" },
                        },
                        disabled: {
                            value: { _light: "{colors.gray.400}", _dark: "{colors.gray.700}" },
                        },
                    },
                    text: {
                        active: {
                            value: { _light: "white", _dark: "{colors.green.500}" },
                        },
                        disabled: {
                            value: { _light: "{colors.gray.700}", _dark: "{colors.gray.400}" },
                        },
                    },
                    border: {
                        active: {
                            value: { _light: "{colors.green.800}", _dark: "{colors.green.500}" },
                        },
                        disabled: {
                            value: { _light: "{colors.gray.700}", _dark: "{colors.gray.400}" },
                        },
                    },
                },

                // Skeleton colors
                skeleton: {
                    default: {
                        value: { _light: "{colors.teal.300}", _dark: "{colors.teal.700}" },
                    },
                },
            },
        },
        recipes: {
            button: buttonRecipe,
            skeleton: defineRecipe({
                variants: {
                    defaultSkeleton: {
                        true: {
                            backgroundColor: "{colors.skeleton.default}",
                        },
                    },
                },
            }),
        },
    },
    globalCss: {
        "html, body": {
            backgroundColor: "{colors.pageBackground}",
            height: "fit-content",
            width: "100vw",
            overflowX: "hidden",
            fontFamily: "fonts.body",
        },
        "::selection": {
            backgroundColor: "{colors.selectionColor}",
        },
        ".rainbow-animation": {
            backgroundImage: "linear-gradient(270deg, pink, purple, blue, red, blue, purple, pink) !important",
            backgroundSize: "1000% 1000% !important",
            textShadow: "0px 0px 5px black !important",
            animation: `${rainbowAnimation} 20s linear infinite !important`,
        },
        ".rainbow-border-animation": {
            animation: `${borderColorAnimation} 10s linear infinite`,
        },
        ".pulse-shadow-animation": {
            animation: `${pulseShadow} 2s ease-in-out infinite !important`,
        },
        ".chakra-popover__arrowTip": {
            backgroundColor: "{colors.pageBackground} !important",
            borderColor: "{colors.contentBorder} !important",
            borderTopWidth: "2px !important",
            borderInlineStartWidth: "2px !important",
            marginTop: "1px !important",
        },
        // Temp workaround for menu items
        // Otherwise, the first item is focused when the menu is opened
        "a:focus, a:focus-visible": {
            outline: "none !important",
            boxShadow: "none !important",
        },
        ".recharts-surface:focus": {
            outline: "none !important",
        },
    },
})

export const systemConfig = createSystem(defaultConfig, customConfig)

export default systemConfig
