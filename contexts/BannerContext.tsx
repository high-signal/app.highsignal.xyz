"use client"

import { createContext, useContext, ReactNode, useState, useEffect } from "react"

interface BannerContextType {
    bannersChecking: boolean
    fullPageBanner: BannerProps | null
    headerBanners: BannerProps[]
}

const BannerContext = createContext<BannerContextType>({
    bannersChecking: true,
    fullPageBanner: null,
    headerBanners: [],
})

export const useBanner = () => useContext(BannerContext)

export function BannerProvider({ children }: { children: ReactNode }) {
    const [banners, setBanners] = useState<BannerProps[]>([])
    const [bannersChecking, setBannersChecking] = useState(true)

    // Load banners once on mount
    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const response = await fetch(`/api/info/banners`, {
                    method: "GET",
                })
                const data = await response.json()

                if (data.status === "success") {
                    // Handle both array and single object responses
                    const bannerData = data.data
                    if (Array.isArray(bannerData)) {
                        setBanners(bannerData)
                    } else if (bannerData) {
                        setBanners([bannerData])
                    } else {
                        setBanners([])
                    }
                } else {
                    setBanners([])
                }
            } catch (error) {
                console.error("Error fetching banners:", error)
                setBanners([])
            } finally {
                setBannersChecking(false)
            }
        }

        fetchBanners()
    }, [])

    // Get the full page banner if it exists and is enabled
    const fullPageBanner = banners.find((banner) => banner.type === "fullPage") || null

    // Get all header banners
    const headerBanners = banners.filter((banner) => banner.type === "header")

    return (
        <BannerContext.Provider value={{ bannersChecking, fullPageBanner, headerBanners }}>
            {children}
        </BannerContext.Provider>
    )
}
