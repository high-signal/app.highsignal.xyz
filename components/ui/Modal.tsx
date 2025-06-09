import { Dialog, Portal } from "@chakra-ui/react"
import { ReactNode } from "react"

type Placement = "center" | "top" | "bottom"

interface ModalProps {
    placement?: { base: Placement; md: Placement }
    open: boolean
    close: () => void
    children: ReactNode
}

export default function Modal({ placement = { base: "center", md: "center" }, open, close, children }: ModalProps) {
    return (
        <Dialog.Root placement={placement} motionPreset={"slide-in-bottom"} open={open}>
            <Portal>
                <Dialog.Backdrop
                    bg="rgba(0, 0, 0, 0.5)"
                    backdropFilter="blur(3px)"
                    onClick={() => {
                        console.log("close")
                        close()
                    }}
                />
                <Dialog.Positioner>{children}</Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
}
