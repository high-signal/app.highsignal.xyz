import { defineRecipe } from "@chakra-ui/react"

// Run this command when adding a new variant to fix the type error:
// npx @chakra-ui/cli typegen ./styles/theme.ts

const createButtonStyles = (colors: { default: string; hover: string; active: string }) => ({
    backgroundColor: colors.default,
    transition: "all 0.2s ease",
    px: 0,
    py: 0,
    focusRing: "none",
    border: "none",
    h: "fit-content",
    w: "fit-content",
    color: "{colors.textColor}",
    _hover: {
        backgroundColor: colors.hover,
        _active: {
            backgroundColor: colors.active,
        },
        _expanded: {
            backgroundColor: colors.active,
        },
    },
    // Only used for touch devices
    _active: {
        backgroundColor: colors.hover,
    },
    _expanded: {
        backgroundColor: colors.active,
    },
})

export const buttonRecipe = defineRecipe({
    variants: {
        primaryButton: {
            true: {
                ...createButtonStyles({
                    default: "{colors.button.primary.default}",
                    hover: "{colors.button.primary.hover}",
                    active: "{colors.button.primary.active}",
                }),
            },
        },
        secondaryButton: {
            true: {
                ...createButtonStyles({
                    default: "{colors.button.secondary.default}",
                    hover: "{colors.button.secondary.hover}",
                    active: "{colors.button.secondary.active}",
                }),
            },
        },
        contentButton: {
            true: {
                ...createButtonStyles({
                    default: "{colors.button.contentButton.default}",
                    hover: "{colors.button.contentButton.hover}",
                    active: "{colors.button.contentButton.active}",
                }),
            },
        },
        successButton: {
            true: {
                ...createButtonStyles({
                    default: "{colors.button.success.default}",
                    hover: "{colors.button.success.hover}",
                    active: "{colors.button.success.active}",
                }),
            },
        },
        dangerButton: {
            true: {
                ...createButtonStyles({
                    default: "{colors.button.danger.default}",
                    hover: "{colors.button.danger.hover}",
                    active: "{colors.button.danger.active}",
                }),
            },
        },
        closeButton: {
            true: {
                ...createButtonStyles({
                    default: "{colors.button.closeButton.default}",
                    hover: "{colors.button.closeButton.hover}",
                    active: "{colors.button.closeButton.active}",
                }),
            },
        },
    },
})
