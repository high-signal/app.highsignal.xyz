import { HStack, Text, Button } from "@chakra-ui/react"
import Link from "next/link"

import { ColorModeToggle } from "../color-mode/ColorModeToggle"
import ParticleToggle from "../particle-animation/ParticleToggle"
import { FeedbackFish } from "@feedback-fish/react"
import { useUser } from "../../contexts/UserContext"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faMessage, faGlobe } from "@fortawesome/free-solid-svg-icons"
import { faXTwitter } from "@fortawesome/free-brands-svg-icons"
import { EXTERNAL_LINKS } from "../../config/constants"

export default function Footer() {
    const { loggedInUser } = useUser()

    return (
        <HStack
            justifyContent={"space-between"}
            position="relative"
            w="100%"
            pb={5}
            px={3}
            flexWrap={"wrap-reverse"}
            columnGap={{ base: 3, sm: 10 }}
            rowGap={5}
        >
            <HStack
                alignItems={"center"}
                gap={1}
                justifyContent={{ base: "start", sm: "center" }}
                h={"28px"}
                justifySelf={"center"}
            >
                {/* <Text fontWeight={"bold"} textAlign={"center"}>
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
                </Text> */}
                <FeedbackFish projectId="d610a65469bc8f" userId={loggedInUser?.username}>
                    <Button secondaryButton px={3} py={1} borderRadius={"full"}>
                        <HStack>
                            <Text>Give us feedback</Text>
                            <FontAwesomeIcon icon={faMessage} />
                        </HStack>
                    </Button>
                </FeedbackFish>
            </HStack>
            <HStack
                position={{ base: "relative", sm: "absolute" }}
                right={{ base: 0, sm: 5 }}
                bottom={{ base: 0, sm: 5 }}
                gap={{ base: 5, sm: 8 }}
            >
                <HStack gap={3}>
                    <Link href={EXTERNAL_LINKS.website.url} target="_blank">
                        <Button
                            secondaryButton
                            borderRadius={"full"}
                            h={"28px"}
                            minW={"28px"}
                            // mr={{ base: "-5px", sm: 5 }}
                            aria-label={EXTERNAL_LINKS.website.label}
                        >
                            <FontAwesomeIcon icon={faGlobe} size="lg" />
                        </Button>
                    </Link>
                    <Link href={EXTERNAL_LINKS.X.url} target="_blank">
                        <Button
                            secondaryButton
                            borderRadius={"full"}
                            h={"28px"}
                            minW={"28px"}
                            // mr={{ base: "-5px", sm: 5 }}
                            aria-label={EXTERNAL_LINKS.X.label}
                        >
                            <FontAwesomeIcon icon={faXTwitter} size="lg" />
                        </Button>
                    </Link>
                </HStack>
                <HStack gap={3}>
                    <ParticleToggle />
                    <ColorModeToggle />
                </HStack>
            </HStack>
        </HStack>
    )
}
