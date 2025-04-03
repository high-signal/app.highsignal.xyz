import { customConfig } from "../styles/theme"

interface SignalInfo {
    signal: "low" | "mid" | "high"
}

export function calculateSignal(score: number): string {
    const lowThreshold = 30
    const midThreshold = 70
    const highThreshold = 80

    if (score >= highThreshold) {
        return "high"
    } else if (score >= midThreshold) {
        return "mid"
    } else {
        return "low"
    }
}
