import { Dialog, Portal } from "@chakra-ui/react"
import { ReactNode } from "react"

type Placement = "center" | "top" | "bottom"

interface ModalProps {
    placement?: { base: Placement; md: Placement }
    open: boolean
    close: (nextOpen?: boolean) => void
    children: ReactNode
}

export default function Modal({ placement = { base: "center", md: "center" }, open, close, children }: ModalProps) {
    return (
        <Dialog.Root
            placement={placement}
            motionPreset={"slide-in-bottom"}
            open={open}
            onEscapeKeyDown={() => close()}
            onOpenChange={(nextOpen) => {
                if (!nextOpen.open) {
                    close()
                }
            }}
        >
            <Portal>
                <Dialog.Backdrop bg="rgba(0, 0, 0, 0.5)" backdropFilter="blur(3px)" />
                <Dialog.Positioner>{children}</Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
}
