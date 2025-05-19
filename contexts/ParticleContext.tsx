"use client"

import { createContext, useContext, ReactNode, useState, useEffect } from "react"

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
    // Initialize state with a default value
    const [showParticles, setShowParticles] = useState(false)

    // Load localStorage value after mount
    useEffect(() => {
        const savedState = localStorage.getItem("showParticles")
        if (savedState === null) {
            setShowParticles(true) // Default setting for particles
        } else {
            setShowParticles(savedState === "true")
        }
    }, [])

    // Update localStorage when state changes
    const handleSetShowParticles = (show: boolean) => {
        setShowParticles(show)
        if (typeof window !== "undefined") {
            localStorage.setItem("showParticles", show.toString())
        }
    }

    return (
        <ParticleContext.Provider value={{ showParticles, setShowParticles: handleSetShowParticles }}>
            {children}
        </ParticleContext.Provider>
    )
}
