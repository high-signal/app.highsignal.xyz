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
    projectSlug?: string
    projectData?: ProjectData
    peakSignals?: PeakSignalUserData[]
    signalStrengths?: {
        signalStrengthName: string
        data: SignalStrengthUserData[]
        dailyData?: SignalStrengthUserData[]
    }[]
    forumUsers?: ForumUser[]
    isSuperAdmin?: boolean
    connectedAccounts?: ConnectedAccount[]
    defaultProfile?: boolean
    email?: string
    discordUsername?: string
    xUsername?: string
    farcasterUsername?: string
    userAddresses?: UserAddressConfig[]
    timestamp?: number
    lastChecked?: number
}

interface UserAddressConfig {
    address: string
    addressName?: string
    isPublic: boolean
    projectsSharedWith: SharedProjectData[]
}

interface SharedProjectData {
    projectUrlSlug: string
    projectDisplayName: string
    projectLogoUrl?: string
}

interface EditorSettingsState {
    name?: { current: string | null; new: string | null }
    sharing: { current: "private" | "public" | "shared" | null; new: "private" | "public" | "shared" | null }
    projectsSharedWith: { current: SharedProjectData[] | null; new: SharedProjectData[] | null }
}

interface UserPublicOrSharedAccount {
    id?: number
    isPublic?: boolean
    type: string
    userAccountsShared?: {
        projectId: number
        userAccountId: number
        project: SharedProjectData
    }[]
    userId?: number
}
interface ConnectedAccount {
    name: string
    data: ForumUser[]
}

interface ForumUser {
    userId?: string
    projectId?: string
    projectUrlSlug: string
    forumUsername: string
    authEncryptedPayload?: string
    authPostId?: string
    authPostCode?: string
    authPostCodeCreated?: number
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
    maxChars?: number
    logs?: string
    promptTokens?: number
    completionTokens?: number
    lastChecked?: number
    rawValue?: number
    testRequestingUser?: number
    scoreCalculationPeriodPreviousDays?: number // Usually previousDays but made more verbose for the public API
    timestamp?: number
    currentDay?: boolean
}

interface ProjectData {
    id?: number
    urlSlug: string
    displayName: string
    projectLogoUrl: string
    apiKey?: string
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
    maxChars?: number
    url?: string
    availableAuthTypes?: string[]
    authTypes?: string[]
    authParentPostUrl?: string
}

interface SignalStrengthData {
    id: number
    name: string
    signalStrengthName?: string // TODO: Merge with name
    displayName: string
    status: string
    model?: string
    prompts: Prompt[]
    maxChars?: number
    logs?: string
}

interface SignalStrengthProjectSettingsState {
    enabled: { current: boolean | null; new: boolean | null }
    maxValue: { current: number | null; new: number | string | null }
    previousDays: { current: number | null; new: number | string | null }
    url: { current: string | null; new: string | null }
    authTypes: { current: string[] | null; new: string[] | null }
    authParentPostUrl: { current: string | null; new: string | null }
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
    testingMaxChars?: string
}

interface BannerProps {
    id?: number
    type: string
    style: string
    title?: string
    content?: string
    closable: boolean
    enabled?: boolean
    internal_name?: string
}

type LozengeType = "public" | "private" | "shared_address" | "shared_account" | "comingSoon" | "notifications" | "score"
