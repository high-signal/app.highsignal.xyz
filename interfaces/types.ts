interface UserData {
    id?: number
    rank?: number
    score?: number
    peakSignalScore?: number
    signalStrengthScore?: number
    username?: string
    displayName?: string
    profileImageUrl?: string
    signal?: string
    projectData?: ProjectData
    peakSignals?: PeakSignalUserData[]
    signalStrengths?: SignalStrengthUserData[]
    forumUsers?: ForumUser[]
    isSuperAdmin?: boolean
}

interface ForumUser {
    userId: string
    projectId: string
    forumUsername: string
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
    lastChecked?: number
}

interface ProjectData {
    projectSlug: string
    displayName: string
    imageUrl: string
    peakSignalsMaxValue: number
    signalStrengths: SignalStrengthProjectData[]
}

interface SignalStrengthProjectData {
    name: string
    displayName: string
    status: string
    maxValue: number
    enabled: boolean
    previousDays: number
}
