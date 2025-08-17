import { useState, useEffect } from "react"

import { APP_CONFIG } from "../config/constants"

interface UseTestTimerProps {
    maxDuration?: number
    onTimeout?: (duration: number) => void
    setTestError?: (error: string | null) => void
}

interface UseTestTimerReturn {
    setTestTimerStart: (time: number | null) => void
    testTimerStop: number | null
    setTestTimerStop: (time: number | null) => void
    testTimerDuration: number | null
    setTestTimerDuration: (duration: number | null) => void
}

export const useTestTimer = ({
    maxDuration = APP_CONFIG.TEST_TIMER_MAX_DURATION,
    onTimeout,
    setTestError,
}: UseTestTimerProps = {}): UseTestTimerReturn => {
    const [testTimerStart, setTestTimerStart] = useState<number | null>(null)
    const [testTimerStop, setTestTimerStop] = useState<number | null>(null)
    const [testTimerDuration, setTestTimerDuration] = useState<number | null>(null)

    useEffect(() => {
        let intervalId: NodeJS.Timeout

        if (testTimerStart && !testTimerStop) {
            // Update timer every 100ms while test is running
            intervalId = setInterval(() => {
                const currentDuration = Date.now() - testTimerStart
                // Stop if duration exceeds max duration
                if (currentDuration > maxDuration) {
                    setTestTimerStop(Date.now())
                    setTestTimerDuration(maxDuration)
                    setTestError?.(
                        `Test timed out after ${maxDuration / 1000}s. Try again and check the inputs are correct.`,
                    )
                    onTimeout?.(maxDuration)
                    return
                }
                setTestTimerDuration(currentDuration)
            }, 100)
        } else if (testTimerStart && testTimerStop) {
            // Test is complete, set final duration
            setTestTimerDuration(testTimerStop - testTimerStart)
        }

        // Cleanup interval when component unmounts or test stops
        return () => {
            if (intervalId) {
                clearInterval(intervalId)
            }
        }
    }, [testTimerStart, testTimerStop, maxDuration, onTimeout])

    return {
        setTestTimerStart,
        testTimerStop,
        setTestTimerStop,
        testTimerDuration,
        setTestTimerDuration,
    }
}
