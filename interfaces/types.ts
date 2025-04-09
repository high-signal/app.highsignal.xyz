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
    value: string
    summary: string
    description: string
    improvements: string
}

interface ProjectData {
    projectSlug: string
    displayName: string
    imageUrl: string
    signalStrengths: SignalStrengthProjectData[]
}

interface SignalStrengthProjectData {
    name: string
    displayName: string
    maxValue: number
    enabled: boolean
    displayOrderIndex: number
}
