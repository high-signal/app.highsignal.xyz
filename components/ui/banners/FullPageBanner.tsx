"use client"

import { VStack, Text, Image, Button } from "@chakra-ui/react"
import { ASSETS } from "../../../config/constants"
import { usePrivy } from "@privy-io/react-auth"
import { useUser } from "../../../contexts/UserContext"
import { useBanner } from "../../../contexts/BannerContext"

export default function FullPageBanner({ banner }: { banner: BannerProps }) {
    const { login, authenticated } = usePrivy()
    const { loggedInUser } = useUser()
    const { hideFullPageBanner } = useBanner()

    return (
        <VStack w="100dvw" h="100dvh" alignItems="center" mt={20} gap={10}>
            <VStack
                gap={1}
                justifyContent={"center"}
                alignItems={"center"}
                cursor={"default"}
                transform="scale(1.4)"
                onClick={() => {
                    if (!authenticated) {
                        login()
                    }
                }}
            >
                <Image
                    src={`${ASSETS.LOGO_BASE_URL}/w_300,h_300,c_fill,q_auto,f_webp/${ASSETS.LOGO_ID}`}
                    alt="Logo"
                    boxSize={"50px"}
                    minW={"50px"}
                    borderRadius="full"
                />
                <Text minW="80px" fontWeight="bold" fontSize="xl" whiteSpace={"nowrap"}>
                    {process.env.NEXT_PUBLIC_SITE_NAME}
                </Text>
            </VStack>
            <VStack
                w="fit-content"
                bg="contentBackground"
                borderRadius={"16px"}
                px={{ base: 3, sm: 5 }}
                py={{ base: 3, sm: 5 }}
                gap={4}
                zIndex={1}
                textAlign="center"
                mx={3}
            >
                <Text fontSize="2xl" fontWeight="bold">
                    {banner.title}
                </Text>
                <Text>{banner.content}</Text>
            </VStack>
            {/* Note: This is not a secure banner. It is only a "soft" banner 
            that can be closed by anyone who knows how to change state. */}
            {loggedInUser?.isSuperAdmin && (
                <Button primaryButton px={4} py={2} borderRadius={"full"} onClick={() => hideFullPageBanner()}>
                    Super Admin - Close Banner
                </Button>
            )}
        </VStack>
    )
}
