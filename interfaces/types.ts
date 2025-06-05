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
    signalStrengths?: {
        signalStrengthName: string
        data: SignalStrengthUserData[]
    }[]
    forumUsers?: ForumUser[]
    isSuperAdmin?: boolean
    connectedAccounts?: ConnectedAccount[]
    defaultProfile?: boolean
}

interface ConnectedAccount {
    name: string
    data: ForumUser[]
}

interface ForumUser {
    userId: string
    projectId?: string
    projectUrlSlug?: string
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
    id?: number
    day: string
    name: string
    value: string
    maxValue: number
    summary: string
    description: string
    improvements: string
    explainedReasoning?: string
    model?: string
    promptId?: string
    prompt?: string
    temperature?: number
    maxChars?: number
    logs?: string
    promptTokens?: number
    completionTokens?: number
    lastChecked?: number
    rawValue?: number
    testRequestingUser?: number
}

interface ProjectData {
    id?: number
    urlSlug: string
    displayName: string
    projectLogoUrl: string
    peakSignalsEnabled: boolean
    peakSignalsMaxValue: number
    signalStrengths: SignalStrengthProjectData[]
}

interface SignalStrengthProjectData {
    id?: number
    name: string
    displayName: string
    status: string
    maxValue: number
    enabled: boolean
    previousDays: number
    promptId?: string
    prompt?: string
    model?: string
    temperature?: number
    maxChars?: number
    url?: string
}

interface SignalStrengthData {
    id: number
    name: string
    signalStrengthName?: string // TODO: Merge with name
    displayName: string
    status: string
    model?: string
    prompts: Prompt[]
    temperature?: number
    maxChars?: number
    logs?: string
}

interface Prompt {
    id: number
    prompt: string
    created_at: string
    type: string
    signal_strength_id: number
}

interface TestingInputData {
    testingPrompt?: string
    testingModel?: string
    testingTemperature?: string
    testingMaxChars?: string
}
