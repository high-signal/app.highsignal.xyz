import { Tooltip as ChakraTooltip, Portal, useToken } from "@chakra-ui/react"
import * as React from "react"

export interface TooltipProps extends ChakraTooltip.RootProps {
    showArrow?: boolean
    portalled?: boolean
    portalRef?: React.RefObject<HTMLElement>
    content: React.ReactNode
    contentProps?: ChakraTooltip.ContentProps
    disabled?: boolean
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(props, ref) {
    const { showArrow = true, children, disabled, portalled = true, content, contentProps, portalRef, ...rest } = props
    const [pageBackground] = useToken("colors", ["pageBackground"])
    const [tooltipBorder] = useToken("colors", ["gray.400"])

    if (disabled) return children

    return (
        <ChakraTooltip.Root {...rest}>
            <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>
            <Portal disabled={!portalled} container={portalRef}>
                <ChakraTooltip.Positioner>
                    <ChakraTooltip.Content
                        ref={ref}
                        {...contentProps}
                        css={{
                            "--tooltip-bg": pageBackground,
                            position: "relative",
                            "&::before": {
                                content: '""',
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: "var(--tooltip-bg)",
                                borderRadius: "inherit",
                                zIndex: 1,
                            },
                        }}
                        fontSize={"14px"}
                        borderRadius={"full"}
                        color="textColorMuted"
                        border={"2px solid"}
                        borderColor={tooltipBorder}
                        boxShadow={"none"}
                        px={3}
                        py={2}
                    >
                        {showArrow && (
                            <ChakraTooltip.Arrow
                                css={{
                                    "--tooltip-bg": tooltipBorder,
                                    position: "absolute",
                                    zIndex: 0,
                                    transform: "scale(1.2)",
                                }}
                            >
                                <ChakraTooltip.ArrowTip />
                            </ChakraTooltip.Arrow>
                        )}
                        <div style={{ position: "relative", zIndex: 2 }}>{content}</div>
                    </ChakraTooltip.Content>
                </ChakraTooltip.Positioner>
            </Portal>
        </ChakraTooltip.Root>
    )
})
