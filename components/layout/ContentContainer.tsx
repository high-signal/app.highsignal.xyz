"use client"

import { VStack, Box } from "@chakra-ui/react"
import { ReactNode } from "react"

import Toaster from "../ui/toaster"
import Header from "../layout/Header"
import Footer from "./Footer"

import { useBanner } from "../../contexts/BannerContext"
import FullPageBanner from "../ui/banners/FullPageBanner"
import HeaderBanner from "../ui/banners/HeaderBanner"

interface ContentContainerProps {
    children: ReactNode
}

export default function ContentContainer({ children }: ContentContainerProps) {
    const { bannersChecking, fullPageBanner, headerBanners } = useBanner()

    if (!bannersChecking) {
        if (fullPageBanner) {
            return <FullPageBanner banner={fullPageBanner} />
        } else {
            return (
                <VStack minH="100dvh" h={"fit-content"} gap={0} overflow={"hidden"}>
                    <Toaster />
                    {headerBanners.map((banner, index) => (
                        <HeaderBanner key={index} banner={banner} index={index} />
                    ))}
                    <Header />
                    <VStack
                        alignItems={"center"}
                        justifyContent={"center"}
                        gap={5}
                        w={"100%"}
                        maxW={{ base: "100%", sm: "95dvw" }}
                        pt={{ base: 0, sm: 5 }}
                        zIndex={1}
                    >
                        {children}
                    </VStack>
                    <Box flexGrow={1} minH={"100px"} />
                    <Footer />
                </VStack>
            )
        }
    }
}
