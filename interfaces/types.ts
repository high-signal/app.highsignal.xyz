interface UserData {
    score: number
    username: string
    displayName: string
    profileImageUrl: string
    signal: string
    projectData: ProjectData
    peakSignals: PeakSignalUserData[]
    signalStrengths: SignalStrengthUserData[]
}

interface PeakSignalUserData {
    name: string
    displayName: string
    value: number
    imageSrc: string
    imageAlt: string
}

interface SignalStrengthUserData {
    name: string
    displayName: string
    value: string
    maxValue: string
    summary: string
    description: string
    improvements: string
}

interface ProjectData {
    displayName: string
    imageUrl: string
}
