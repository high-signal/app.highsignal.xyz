"use client"

import { useEffect, useState } from "react"
import ContentContainer from "../layout/ContentContainer"
import LeaderboardContainer from "../leaderboard/LeaderboardContainer"
import EarlyAccessInput from "./EarlyAccessInput"

export default function ClientGate({ earlyAccessCodeUrlParam }: { earlyAccessCodeUrlParam: string }) {
    const [hasAccess, setHasAccess] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (earlyAccessCodeUrlParam?.toLowerCase() === "higher") {
            localStorage.setItem("earlyAccessCode", "higher")
            setHasAccess(true)
        } else if (localStorage.getItem("earlyAccessCode") === "higher") {
            setHasAccess(true)
        }
        console.log("Setting isLoading to false")
        setIsLoading(false)
    }, [])

    if (isLoading) {
        return <></>
    }

    if (hasAccess || process.env.NODE_ENV === "development") {
        return (
            <ContentContainer>
                <LeaderboardContainer project="lido" />
            </ContentContainer>
        )
    }

    return <EarlyAccessInput setHasAccess={setHasAccess} />
}
