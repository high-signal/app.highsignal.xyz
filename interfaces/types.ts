interface PeakSignal {
    imageSrc: string
    imageAlt: string
    title: string
    value: string
}

interface PeakSignalsProps {
    peakSignals: PeakSignal[]
}

interface Metrics {
    lidoProtocolEngagement: {
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
    signal: string
    signalValue: number
    signalColor: string
    peakSignals: PeakSignal[]
    metrics: Metrics
}

interface SignalBoxProps {
    imageSrc: string
    imageAlt: string
    title: string
    value: string
}

interface CurrentSignalProps {
    signal: string
    signalValue: number
    signalColor: string
}

interface SignalStrengthContainerProps {
    metrics: Metrics
}

declare module "*/userData.json" {
    const value: Record<string, UserData>
    export default value
}
