"use client"

import { IconButton } from "@chakra-ui/react"
import { useTheme } from "next-themes"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons"

export function ColorModeToggle() {
    const { theme, setTheme } = useTheme()
    const toggleColorMode = () => {
        setTheme(theme === "light" ? "dark" : "light")
    }
    return (
        <IconButton
            aria-label="Toggle color mode"
            borderRadius={"100%"}
            onClick={toggleColorMode}
            color={"textColor"}
            bg={"contentBackground"}
            _hover={{
                bg: "contentBackgroundHover",
            }}
            fontSize={"2xl"}
        >
            <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} />
        </IconButton>
    )
}
