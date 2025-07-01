export interface UserData {
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

export interface ConnectedAccount {
    name: string
    data: ForumUser[]
}

export interface ForumUser {
    userId: string
    projectId: string
    forumUsername: string
}

export interface PeakSignalUserData {
    name: string
    displayName: string
    value: number
    imageSrc: string
    imageAlt: string
}

export interface SignalStrengthUserData {
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

export interface ProjectData {
    id?: number
    urlSlug: string
    displayName: string
    projectLogoUrl: string
    peakSignalsEnabled: boolean
    peakSignalsMaxValue: number
    signalStrengths: SignalStrengthProjectData[]
}

export interface SignalStrengthProjectData {
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
}

export interface SignalStrengthData {
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

export interface Prompt {
    id: number
    prompt: string
    created_at: string
    type: string
    signal_strength_id: number
}

export interface TestingInputData {
    testingPrompt?: string
    testingModel?: string
    testingTemperature?: string
    testingMaxChars?: string
}

export interface PlatformOutput {
    topic_id: number | string
    author: string
    content: string
    timestamp: string
    reply_count: number
    like_count: number
    tags: string[]
    metadata?: Record<string, any>
}

export interface AiConfig {
    signalStrengthId: number
    model: string
    temperature: number
    maxChars: number
    prompts: Prompt[]
    maxValue: number
}

export interface ModelConfig {
    model: string
    temperature: number
    maxTokens?: number
}

export interface AIScoreOutput {
    value?: number
    summary: string
    description: string
    improvements: string
    explained_reasoning: string
    modelUsed: string
    requestId?: string
    promptTokens?: number
    completionTokens?: number
}

export interface AIServiceClient {
    getStructuredResponse(prompt: string, modelConfig: ModelConfig): Promise<AIScoreOutput>
}

