import { useToken } from "@chakra-ui/react"
import { useColorMode } from "../../components/color-mode/ColorModeProvider"
import { customConfig } from "../../styles/theme"

/**
 * Hook to get hex color code from theme semantic tokens
 * @param colorTokenName - The name of the color token (e.g., "pageBackground", "textColorMuted", "scoreColor.high")
 * @returns The hex color code for the current color mode
 */
export function useThemeColor(colorTokenName: string): string {
    const { colorMode } = useColorMode()

    // Handle nested color tokens (e.g., "scoreColor.high")
    const getNestedValue = (obj: any, path: string) => {
        return path.split(".").reduce((current, key) => current?.[key], obj)
    }

    // Get the color token reference from the theme (supports nested paths)
    const colorToken = getNestedValue(customConfig.theme?.semanticTokens?.colors, colorTokenName)?.value as {
        _light: string
        _dark: string
    }

    if (!colorToken) {
        console.warn(`Color token "${colorTokenName}" not found in theme`)
        return "#000000" // fallback color
    }

    // Get the appropriate color token reference based on current color mode
    const colorTokenRef = colorMode === "dark" ? colorToken._dark : colorToken._light

    // Extract the actual color token name from the reference (remove {colors. and })
    const actualColorToken = colorTokenRef.replace("{colors.", "").replace("}", "")

    // Get the hex color code using Chakra's useToken hook
    const [hexColor] = useToken("colors", [actualColorToken])

    return hexColor
}
