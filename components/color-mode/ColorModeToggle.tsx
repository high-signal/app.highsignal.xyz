"use client"

import { Button } from "@chakra-ui/react"
import { useTheme } from "next-themes"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons"

import { customConfig } from "../../styles/theme"

export function ColorModeToggle() {
    const { theme, setTheme } = useTheme()
    const toggleColorMode = () => {
        setTheme(theme === "light" ? "dark" : "light")
    }

    const pageBackground = customConfig.theme?.semanticTokens?.colors?.pageBackground?.value as {
        _light: string
        _dark: string
    }

    return (
        <Button
            defaultButton
            aria-label="Toggle color mode"
            borderRadius={"full"}
            onClick={toggleColorMode}
            color={theme === "light" ? pageBackground._dark : pageBackground._light}
            fontSize={"2xl"}
        >
            <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} />
        </Button>
    )
}
