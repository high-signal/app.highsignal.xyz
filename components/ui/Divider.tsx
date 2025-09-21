"use client"

import { Box } from "@chakra-ui/react"

export default function Divider({ borderWidth = 5, my = 0 }: { borderWidth?: number; my?: number }) {
    return <Box w={"100%"} h={"1px"} borderTop={`${borderWidth}px dashed`} borderColor="contentBorder" my={my} />
}
