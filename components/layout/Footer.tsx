import { HStack, Link, Text, Box } from "@chakra-ui/react"

import NextLink from "next/link"
import { ColorModeToggle } from "../color-mode/ColorModeToggle"
import ParticleToggle from "../particle-animation/ParticleToggle"

export default function Footer() {
    return (
        <HStack
            justifyContent={{ base: "space-around", sm: "center" }}
            position="relative"
            w="100%"
            pb={5}
            px={5}
            flexWrap={"wrap-reverse"}
            columnGap={10}
            rowGap={5}
        >
            <HStack
                alignItems={"center"}
                gap={1}
                justifyContent={{ base: "start", sm: "center" }}
                h={"28px"}
                justifySelf={"center"}
            >
                <Text fontWeight={"bold"} textAlign={"center"}>
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
            <HStack
                position={{ base: "relative", sm: "absolute" }}
                right={{ base: 0, sm: 5 }}
                bottom={{ base: 0, sm: 5 }}
                gap={5}
            >
                <ParticleToggle />
                <ColorModeToggle />
            </HStack>
        </HStack>
    )
}
