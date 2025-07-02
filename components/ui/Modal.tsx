import { Dialog, Portal, useBreakpointValue } from "@chakra-ui/react"
import { ReactNode } from "react"
import { RemoveScroll } from "react-remove-scroll"

type Placement = "center" | "top" | "bottom"
type Size = "xs" | "sm" | "md" | "lg" | "full"

interface ModalProps {
    placement?: { base: Placement; md: Placement }
    open: boolean
    close: (nextOpen?: boolean) => void
    children: ReactNode
    closeOnInteractOutside?: boolean
}

export default function Modal({
    placement = { base: "center", md: "center" },
    open,
    close,
    children,
    closeOnInteractOutside = true,
}: ModalProps) {
    const modalSize = useBreakpointValue({ base: "lg", md: "sm" }) as Size

    return (
        <Dialog.Root
            placement={placement}
            size={modalSize}
            motionPreset={"slide-in-bottom"}
            open={open}
            onEscapeKeyDown={() => close()}
            closeOnInteractOutside={closeOnInteractOutside}
            onOpenChange={(nextOpen) => {
                if (!nextOpen.open) {
                    close()
                }
            }}
        >
            {open && (
                <Portal>
                    <Dialog.Backdrop bg="rgba(0, 0, 0, 0.5)" backdropFilter="blur(3px)" />
                    <RemoveScroll allowPinchZoom>
                        <Dialog.Positioner>{children}</Dialog.Positioner>
                    </RemoveScroll>
                </Portal>
            )}
        </Dialog.Root>
    )
}
