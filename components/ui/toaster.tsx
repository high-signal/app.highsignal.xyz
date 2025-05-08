"use client"

import { Toaster as ChakraToaster, Portal, Toast, VStack, createToaster } from "@chakra-ui/react"

export const toaster = createToaster({
    placement: "bottom-end",
    pauseOnPageIdle: true,
    duration: 10000,
})

export default function Toaster() {
    return (
        <Portal>
            <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
                {(toast) => (
                    <Toast.Root
                        w={"fit-content"}
                        minW={{ base: "100%", sm: toast.description ? "400px" : "fit-content" }}
                        h={"fit-content"}
                        alignItems="center"
                        borderRadius="20px"
                    >
                        <VStack
                            w={{ base: "fit-content", sm: toast.description ? "100%" : "fit-content" }}
                            alignItems="center"
                        >
                            {toast.title && (
                                <Toast.Title mr={4} ml={toast.description ? 4 : 0} w={"max-content"}>
                                    {typeof toast.title === "string" ? (
                                        <>
                                            <span style={{ paddingRight: "5px" }}>{toast.title.charAt(0)}</span>
                                            {toast.title.slice(1)}
                                        </>
                                    ) : (
                                        toast.title
                                    )}
                                </Toast.Title>
                            )}
                            {toast.description && (
                                <Toast.Description textAlign={"center"}>{toast.description}</Toast.Description>
                            )}
                            {toast.action && (
                                <Toast.ActionTrigger borderRadius="full" border={"2px solid"} cursor="pointer">
                                    {toast.action.label}
                                </Toast.ActionTrigger>
                            )}
                        </VStack>
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
