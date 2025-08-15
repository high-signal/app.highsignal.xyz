"use client"

import { VStack, Text, Image } from "@chakra-ui/react"
import { ASSETS } from "../../../config/constants"
import { usePrivy } from "@privy-io/react-auth"

export default function FullPageBanner({ banner }: { banner: BannerProps }) {
    const { login, authenticated } = usePrivy()
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
                px={5}
                py={4}
                gap={4}
                zIndex={1}
                textAlign="center"
            >
                <Text fontSize="2xl" fontWeight="bold">
                    {banner.title}
                </Text>
                <Text>{banner.content}</Text>
            </VStack>
        </VStack>
    )
}
