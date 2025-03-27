interface PeakSignal {
    imageSrc: string
    imageAlt: string
    title: string
    value: string
}

interface Metrics {
    validatorCount: {
        value: string
        percentage: string
    }
    lidoForumEngagement: {
        value: string
        percentage: string
    }
    xEngagement: {
        value: string
        percentage: string
        color: string
        warning: string
    }
}

interface UserData {
    name: string
    operatorNumber: string
    operatorImage: string
    signalValue: number
    signalColor: string
    peakSignals: PeakSignal[]
    metrics: Metrics
}

declare module "*/userData.json" {
    const value: Record<string, UserData>
    export default value
}
