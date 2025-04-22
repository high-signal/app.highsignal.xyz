const lowThreshold = 30
const highThreshold = 80

export function calculateSignalFromScore(score: number): string {
    if (score >= highThreshold) {
        return "high"
    } else if (score >= lowThreshold) {
        return "mid"
    } else {
        return "low"
    }
}

export function calculateSignalThresholdFromName(name: string): number {
    if (name.toLowerCase() === "low") {
        return lowThreshold
    } else {
        return highThreshold
    }
}

export function calculateSignalPercentageFromName(name: string): number {
    if (name.toLowerCase() === "low") {
        return lowThreshold
    } else if (name.toLowerCase() === "mid") {
        return highThreshold - lowThreshold
    } else {
        return 100 - highThreshold
    }
}
