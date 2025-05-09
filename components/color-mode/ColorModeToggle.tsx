"use client"

import { Box, Switch } from "@chakra-ui/react"
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
        <Switch.Root size="lg" onChange={toggleColorMode} defaultChecked={theme === "light"} transform="scale(1.2)">
            <Switch.HiddenInput />
            <Switch.Control bg={"button.default"}>
                <Switch.Thumb bg={"pageBackground"} boxShadow={"none"}>
                    <Switch.ThumbIndicator
                        fallback={
                            <Box
                                color={pageBackground._light}
                                boxSize={"100%"}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <FontAwesomeIcon icon={faSun} color={pageBackground._light} />
                            </Box>
                        }
                    >
                        <Box
                            color={pageBackground._dark}
                            boxSize={"100%"}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <FontAwesomeIcon icon={faMoon} color={pageBackground._dark} />
                        </Box>
                    </Switch.ThumbIndicator>
                </Switch.Thumb>
            </Switch.Control>
        </Switch.Root>
    )
}
