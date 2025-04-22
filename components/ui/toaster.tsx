"use client"

import { Toaster as ChakraToaster, Portal, Toast, VStack, createToaster } from "@chakra-ui/react"

export const toaster = createToaster({
    placement: "top-end",
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
                        minW={{ base: "100%", sm: "400px" }}
                        h={"fit-content"}
                        alignItems="center"
                        borderRadius="20px"
                    >
                        <VStack w={"100%"} alignItems="center">
                            {toast.title && (
                                <Toast.Title
                                    _selection={{
                                        bg: "gray.600",
                                    }}
                                >
                                    {toast.title}
                                </Toast.Title>
                            )}
                            {toast.description && (
                                <Toast.Description
                                    _selection={{
                                        bg: "gray.600",
                                    }}
                                >
                                    {toast.description}
                                </Toast.Description>
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
