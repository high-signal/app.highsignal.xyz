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
    const [showParticles, setShowParticles] = useState(false)

    return <ParticleContext.Provider value={{ showParticles, setShowParticles }}>{children}</ParticleContext.Provider>
}
