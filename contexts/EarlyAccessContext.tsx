"use client"

import { createContext, useContext, ReactNode, useState, useEffect } from "react"
import EarlyAccessInput from "../components/early-access/EarlyAccessInput"
import RootParticleAnimation from "../components/particle-animation/RootParticleAnimation"

interface EarlyAccessContextType {
    hasAccess: boolean
    setHasAccess: (hasAccess: boolean) => void
}

const EarlyAccessContext = createContext<EarlyAccessContextType>({
    hasAccess: false,
    setHasAccess: () => {},
})

export const useEarlyAccess = () => useContext(EarlyAccessContext)

export function EarlyAccessProvider({ children }: { children: ReactNode }) {
    const [hasAccess, setHasAccess] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Load localStorage value after mount
    useEffect(() => {
        const savedAccess = localStorage.getItem("earlyAccessCode")
        if (savedAccess === "higher") {
            setHasAccess(true)
        }
        setIsLoading(false)
    }, [])

    // Update localStorage when state changes
    const handleSetHasAccess = (access: boolean) => {
        setHasAccess(access)
        if (typeof window !== "undefined") {
            if (access) {
                localStorage.setItem("earlyAccessCode", "higher")
            } else {
                localStorage.removeItem("earlyAccessCode")
            }
        }
    }

    return (
        <EarlyAccessContext.Provider value={{ hasAccess, setHasAccess: handleSetHasAccess }}>
            <RootParticleAnimation />
            {isLoading ? null : hasAccess ? children : <EarlyAccessInput />}
        </EarlyAccessContext.Provider>
    )
}
