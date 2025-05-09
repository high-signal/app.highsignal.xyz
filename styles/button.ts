import { defineRecipe } from "@chakra-ui/react"

// Run this command when adding a new variant to fix the type error:
// npx @chakra-ui/cli typegen ./styles/theme.ts

const sharedButtonStyles = {
    backgroundColor: "{colors.button.default}",
    color: "{colors.textColor}",
    cursor: "pointer",
    transition: "all 0.2s ease",
    _hover: {
        backgroundColor: "{colors.button.hover}",
        _active: {
            backgroundColor: "{colors.button.active}",
        },
        _expanded: {
            backgroundColor: "{colors.button.active}",
        },
    },
    _active: {
        backgroundColor: "{colors.button.active}",
    },
    _expanded: {
        backgroundColor: "{colors.button.active}",
    },
    px: 0,
    py: 0,
    focusRing: "none",
}

export const buttonRecipe = defineRecipe({
    variants: {
        defaultButton: {
            true: {
                ...sharedButtonStyles,
            },
        },
    },
})
