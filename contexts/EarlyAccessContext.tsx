"use client"

import { createContext, useContext, ReactNode, useState, useEffect } from "react"
import EarlyAccessInput from "../components/early-access/EarlyAccessInput"
import RootParticleAnimation from "../components/particle-animation/RootParticleAnimation"

interface EarlyAccessContextType {
    hasAccess: boolean
    setHasAccess: (hasAccess: boolean, code?: string) => void
}

const EarlyAccessContext = createContext<EarlyAccessContextType>({
    hasAccess: false,
    setHasAccess: () => {},
})

export const useEarlyAccess = () => useContext(EarlyAccessContext)

export function EarlyAccessProvider({ children }: { children: ReactNode }) {
    const [hasAccess, setHasAccess] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Check access code against the database
    const handleCheckAccessCode = async (code: string) => {
        const response = await fetch(`/api/access-code-check`, {
            method: "POST",
            body: JSON.stringify({ code }),
        })

        const data = await response.json()

        if (data.success) {
            setHasAccess(true)
        } else {
            setHasAccess(false)
        }
    }

    // Load localStorage value after mount
    useEffect(() => {
        const savedAccess = localStorage.getItem("earlyAccessCode")

        // Check access code against the database
        if (savedAccess) {
            handleCheckAccessCode(savedAccess).finally(() => {
                setIsLoading(false)
            })
        } else {
            setIsLoading(false)
        }
    }, [])

    // Update localStorage when state changes
    const handleSetHasAccess = (access: boolean, code?: string) => {
        setHasAccess(access)
        if (typeof window !== "undefined") {
            if (access && code) {
                localStorage.setItem("earlyAccessCode", code)
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
