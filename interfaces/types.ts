interface UserData {
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
    displayName: string
    value: number
    imageSrc: string
    imageAlt: string
}

interface SignalStrengthData {
    name: string
    displayName: string
    value: string
    maxValue: string
    summary: string
    description: string
}
