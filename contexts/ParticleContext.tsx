"use client"

import { createContext, useContext, ReactNode, useState } from "react"

interface ParticleContextType {
    showParticles: boolean
    setShowParticles: (show: boolean) => void
}

const ParticleContext = createContext<ParticleContextType>({
    showParticles: true,
    setShowParticles: () => {},
})

export const useParticles = () => useContext(ParticleContext)

export function ParticleProvider({ children }: { children: ReactNode }) {
    // Initialize state with localStorage value if available
    const [showParticles, setShowParticles] = useState(() => {
        if (typeof window !== "undefined") {
            const savedState = localStorage.getItem("showParticles")
            return savedState !== null ? savedState === "true" : false
        }
        return false
    })

    // Update localStorage when state changes
    const handleSetShowParticles = (show: boolean) => {
        setShowParticles(show)
        localStorage.setItem("showParticles", show.toString())
    }

    return (
        <ParticleContext.Provider value={{ showParticles, setShowParticles: handleSetShowParticles }}>
            {children}
        </ParticleContext.Provider>
    )
}
