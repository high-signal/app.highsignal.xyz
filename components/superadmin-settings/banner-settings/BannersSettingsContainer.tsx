"use client"

import { useState, useEffect } from "react"
import { Spinner, Text, VStack } from "@chakra-ui/react"

import SettingsSectionContainer from "../../ui/SettingsSectionContainer"
import BannerSettings from "./BannerSettings"

import { usePrivy } from "@privy-io/react-auth"

export default function BannersSettingsContainer() {
    const [banners, setBanners] = useState<BannerProps[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { getAccessToken } = usePrivy()

    const [error, setError] = useState<string | null>()

    const [triggerRefresh, setTriggerRefresh] = useState<boolean>(false)

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const token = await getAccessToken()
                const response = await fetch("/api/settings/superadmin/banners", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                })
                const dataJson = await response.json()

                if (dataJson.status !== "success") {
                    setError(dataJson.error)
                } else {
                    setBanners(dataJson.data)
                    setError(null)
                }
            } catch (error) {
                console.error("Error fetching banners:", error)
                setError("Error fetching banners")
            } finally {
                setIsLoading(false)
            }
        }
        fetchBanners()
    }, [triggerRefresh])

    if (error) {
        return (
            <SettingsSectionContainer>
                <Text color="orange.500">{error}</Text>
            </SettingsSectionContainer>
        )
    }

    if (isLoading) {
        return (
            <SettingsSectionContainer>
                <Spinner size="lg" />
            </SettingsSectionContainer>
        )
    }

    if (!isLoading && banners.length === 0) {
        return (
            <SettingsSectionContainer>
                <Text>No banners found</Text>
            </SettingsSectionContainer>
        )
    }

    return (
        <SettingsSectionContainer>
            <VStack alignItems="start" w={"100%"} gap={1}>
                <Text>- Closable is only on header banners and adds the (x) button.</Text>
                <Text>
                    - Closed header banners will still come back every time you reload the page as it is not saving to
                    local storage (but could do in the future).
                </Text>
                <Text>- Full page banners have a close button when logged in as a super admin.</Text>
                <Text>
                    - On full page banners, if you are a superadmin but are not logged in, click the High Signal logo to
                    open the &quot;hidden&quot; login menu. This is to allow super admins to bypass the full page banner
                    and still access the site.
                </Text>
                <Text>
                    - Currently, there is only one of each banner type, but in future more could be added to this list
                    to allow them to more easily be switched between.
                </Text>
            </VStack>
            <VStack alignItems="start" w={"100%"} gap={10}>
                {banners.map((banner) => (
                    <BannerSettings key={banner.id} banner={banner} setTriggerRefresh={setTriggerRefresh} />
                ))}
            </VStack>
        </SettingsSectionContainer>
    )
}
