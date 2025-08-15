"use client"

import { createContext, useContext, ReactNode, useState, useEffect } from "react"

interface BannerContextType {
    bannersChecking: boolean
    fullPageBanner: BannerProps | null
    headerBanners: BannerProps[]
    hideFullPageBanner: () => void
    hideHeaderBanner: (originalIndex: number) => void
    getOriginalIndex: (filteredIndex: number) => number
}

const BannerContext = createContext<BannerContextType>({
    bannersChecking: true,
    fullPageBanner: null,
    headerBanners: [],
    hideFullPageBanner: () => {},
    hideHeaderBanner: () => {},
    getOriginalIndex: () => 0,
})

export const useBanner = () => useContext(BannerContext)

export function BannerProvider({ children }: { children: ReactNode }) {
    const [banners, setBanners] = useState<BannerProps[]>([])
    const [bannersChecking, setBannersChecking] = useState(true)
    const [hiddenFullPageBanner, setHiddenFullPageBanner] = useState(false)
    const [hiddenHeaderBanners, setHiddenHeaderBanners] = useState<Set<number>>(new Set())

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

    // Function to hide the full page banner
    const hideFullPageBanner = () => {
        setHiddenFullPageBanner(true)
    }

    // Get the full page banner if it is not hidden
    const fullPageBanner = !hiddenFullPageBanner ? banners.find((banner) => banner.type === "fullPage") || null : null

    // Get all header banners that are not hidden
    const allHeaderBanners = banners.filter((banner) => banner.type === "header")
    const headerBanners = allHeaderBanners.filter((_, index) => !hiddenHeaderBanners.has(index))

    // Function to hide a header banner by original index
    const hideHeaderBanner = (originalIndex: number) => {
        setHiddenHeaderBanners((prev) => new Set([...prev, originalIndex]))
    }

    // Function to get original index from filtered index
    const getOriginalIndex = (filteredIndex: number): number => {
        const visibleBanners = allHeaderBanners.filter((_, index) => !hiddenHeaderBanners.has(index))
        if (filteredIndex >= 0 && filteredIndex < visibleBanners.length) {
            const targetBanner = visibleBanners[filteredIndex]
            return allHeaderBanners.findIndex((banner) => banner === targetBanner)
        }
        return -1
    }

    return (
        <BannerContext.Provider
            value={{
                bannersChecking,
                fullPageBanner,
                headerBanners,
                hideFullPageBanner,
                hideHeaderBanner,
                getOriginalIndex,
            }}
        >
            {children}
        </BannerContext.Provider>
    )
}
