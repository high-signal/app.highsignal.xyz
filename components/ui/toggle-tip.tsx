"use client"

import { Popover as ChakraPopover, Portal } from "@chakra-ui/react"
import React from "react"

export interface ToggleTipProps extends ChakraPopover.RootProps {
    portalled?: boolean
    portalRef?: React.RefObject<HTMLElement>
    content?: React.ReactNode
}

export const ToggleTip = React.forwardRef<HTMLDivElement, ToggleTipProps>(function ToggleTip(props, ref) {
    const { children, portalled = true, content, portalRef, ...rest } = props

    return (
        <ChakraPopover.Root {...rest} positioning={{ ...rest.positioning, gutter: 4 }}>
            <ChakraPopover.Trigger asChild>{children}</ChakraPopover.Trigger>
            <Portal disabled={!portalled} container={portalRef}>
                <ChakraPopover.Positioner>
                    <ChakraPopover.Content
                        maxW={"90dvw"}
                        p={2}
                        rounded="12px"
                        ref={ref}
                        bg={"pageBackground"}
                        borderWidth={2}
                        borderColor={"contentBorder"}
                    >
                        <ChakraPopover.Arrow>
                            <ChakraPopover.ArrowTip />
                        </ChakraPopover.Arrow>

                        {content}
                    </ChakraPopover.Content>
                </ChakraPopover.Positioner>
            </Portal>
        </ChakraPopover.Root>
    )
})
