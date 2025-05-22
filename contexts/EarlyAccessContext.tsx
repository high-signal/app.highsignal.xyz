"use client"

import { createContext, useContext, ReactNode, useState, useEffect } from "react"
import EarlyAccessInput from "../components/early-access/EarlyAccessInput"
import RootParticleAnimation from "../components/particle-animation/RootParticleAnimation"
import { useUser } from "../contexts/UserContext"
import { usePrivy } from "@privy-io/react-auth"

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

    const { authenticated, ready: privyReady } = usePrivy()
    const { loggedInUser, loggedInUserLoading } = useUser()

    // Load localStorage value after mount
    useEffect(() => {
        const checkAccess = async () => {
            // Check localStorage for early access code first
            const savedAccess = localStorage.getItem("earlyAccessCode")
            if (savedAccess) {
                const response = await fetch(`/api/access-code?code=${savedAccess}`, {
                    method: "GET",
                })
                const data = await response.json()

                if (data.success) {
                    setHasAccess(true)
                    setIsLoading(false)
                    return
                }
            }

            // If localStorage check failed or no saved access, check logged in user
            if (privyReady) {
                if (authenticated) {
                    if (!loggedInUserLoading) {
                        if (loggedInUser?.accessCode) {
                            localStorage.setItem("earlyAccessCode", loggedInUser.accessCode)
                            setHasAccess(true)
                            setIsLoading(false)
                        } else {
                            setIsLoading(false)
                        }
                    }
                } else {
                    // If user is not logged in, set loading to false
                    setIsLoading(false)
                }
            }
        }

        checkAccess()
    }, [loggedInUser, authenticated, privyReady, loggedInUserLoading])

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
