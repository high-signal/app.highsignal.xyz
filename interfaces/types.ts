interface UserData {
    userId: string
    score: number
    username: string
    displayName: string
    profileImageUrl: string
    signal: string
    peakSignals: PeakSignal[]
    signalStrengths: SignalStrengthData[]
}

interface PeakSignal {
    name: string
    imageSrc: string
    imageAlt: string
    value: number
    projectId: string
}

interface SignalStrengthData {
    value: string
    percentage: string
}
