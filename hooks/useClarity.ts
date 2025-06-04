import { useEffect } from "react"
import clarity from "@microsoft/clarity"

declare global {
    interface Window {
        clarity: typeof clarity
    }
}

export const useClarity = (projectId: string) => {
    useEffect(() => {
        if (typeof window !== "undefined" && !window.clarity) {
            window.clarity = clarity
            window.clarity.init(projectId)
        }
    }, [projectId])
}
