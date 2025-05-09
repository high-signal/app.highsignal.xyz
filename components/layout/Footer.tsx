import { HStack, Link, Text, Box } from "@chakra-ui/react"

import NextLink from "next/link"
import { ColorModeToggle } from "../color-mode/ColorModeToggle"

export default function Footer() {
    return (
        <Box position="relative" w="100%" pb={5} px={3}>
            <HStack alignItems={"center"} gap={1} justifyContent={"center"}>
                <Text fontWeight={"bold"}>
                    Built with ❤️ by{" "}
                    <Link
                        as={NextLink}
                        href={"https://eridian.xyz"}
                        color={"blue.500"}
                        textDecoration={"underline"}
                        target="_blank"
                    >
                        Eridian
                    </Link>
                </Text>
            </HStack>
            <Box position="absolute" right={3} bottom={3}>
                <ColorModeToggle />
            </Box>
        </Box>
    )
}
