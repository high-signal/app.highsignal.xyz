"use client"

import { Toaster as ChakraToaster, Portal, Spinner, Stack, Toast, VStack, createToaster } from "@chakra-ui/react"

export const toaster = createToaster({
    placement: "top-end",
    pauseOnPageIdle: true,
})

export default function Toaster() {
    return (
        <Portal>
            <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
                {(toast) => (
                    <Toast.Root
                        w={"fit-content"}
                        minW={"300px"}
                        h={"fit-content"}
                        alignItems="center"
                        borderRadius="20px"
                    >
                        <VStack maxWidth="100%">
                            {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
                            {toast.description && <Toast.Description>{toast.description}</Toast.Description>}
                        </VStack>
                        {toast.action && <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>}
                        <Toast.CloseTrigger
                            cursor="pointer"
                            top={"14px"}
                            right={"8px"}
                            _hover={{ bg: "pageBackground" }}
                            borderRadius="full"
                        />
                    </Toast.Root>
                )}
            </ChakraToaster>
        </Portal>
    )
}
