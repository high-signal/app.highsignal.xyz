import { defineRecipe } from "@chakra-ui/react"

// Run this command when adding a new variant to fix the type error:
// npx @chakra-ui/cli typegen ./styles/theme.ts

const sharedButtonStyles = {
    backgroundColor: "{colors.button.default}",
    transition: "all 0.2s ease",
    px: 0,
    py: 0,
    focusRing: "none",
    border: "none",
    color: "{colors.textColor}",
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
    h: "fit-content",
    w: "fit-content",
}

export const buttonRecipe = defineRecipe({
    variants: {
        defaultButton: {
            true: {
                ...sharedButtonStyles,
            },
        },
        closeButton: {
            true: {
                ...sharedButtonStyles,
                backgroundColor: "{colors.closeButton.default}",
                _hover: {
                    backgroundColor: "{colors.closeButton.hover}",
                    _active: {
                        backgroundColor: "{colors.closeButton.active}",
                    },
                },
                _active: {
                    backgroundColor: "{colors.closeButton.active}",
                },
            },
        },
    },
})
