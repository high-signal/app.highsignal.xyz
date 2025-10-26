function calculateSmartScore({ signalStrengthName, userData, previousDays, maxValue }) {
    if (!userData.length) return { smartScore: 0, topBandDays: [] }

    let topThresholdNormalizedLowerBound // Take the normalized value and subtract this value to get the lower bound of the top band
    let topBandMaxLengthToConsider
    let firstFrequencyMultiplierValue
    let secondFrequencyMultiplierValue
    let thirdFrequencyMultiplierValue
    let lowerFrequencyMultiplierCount
    let upperFrequencyMultiplierCount
    let timeDecayPercent // final 30% of period decays to 0

    if (signalStrengthName === "discourse_forum") {
        topThresholdNormalizedLowerBound = 0.3
        topBandMaxLengthToConsider = 5
        firstFrequencyMultiplierValue = 0.5
        secondFrequencyMultiplierValue = 0.7
        thirdFrequencyMultiplierValue = 0.85
        lowerFrequencyMultiplierCount = 2
        upperFrequencyMultiplierCount = 5
        timeDecayPercent = 0.3
    } else if (signalStrengthName === "discord") {
        topThresholdNormalizedLowerBound = 0.3
        topBandMaxLengthToConsider = 10
        firstFrequencyMultiplierValue = 0.1
        secondFrequencyMultiplierValue = 0.3
        thirdFrequencyMultiplierValue = 0.6
        lowerFrequencyMultiplierCount = 3
        upperFrequencyMultiplierCount = 6
        timeDecayPercent = 0.3
    } else {
        throw new Error(`No smart score calculation configured for ${signalStrengthName}`)
    }

    const roundToTwoDecimals = (value) => {
        return Math.round(value * 100) / 100
    }

    // If the day is within the last timeDecayPercent of the period,
    // the normalized value is multiplied by the time weight
    // based on how far away from the end of the period it is
    const timeDecayWeighted = ({ normalizedRawValue, day }) => {
        const today = new Date()
        const inputDate = new Date(day)

        // Ensure input date is not in the future
        if (inputDate > today) return 0

        const msPerDay = 1000 * 60 * 60 * 24
        const ageInDays = Math.floor((today.getTime() - inputDate.getTime()) / msPerDay)

        if (ageInDays < 0 || ageInDays > previousDays) {
            return 0 // Outside range
        }

        const decayStartDay = Math.floor(previousDays * (1 - timeDecayPercent))

        let timeDecayMultiplier = 1

        if (ageInDays > decayStartDay) {
            const decayProgress = (ageInDays - decayStartDay) / (previousDays - decayStartDay)
            timeDecayMultiplier = 1 - decayProgress
        }

        // Limit timeDecayMultiplier to [0, 1]
        timeDecayMultiplier = Math.max(0, Math.min(1, timeDecayMultiplier))
        return roundToTwoDecimals(normalizedRawValue * timeDecayMultiplier)
    }

    const enriched = userData.map((data) => {
        const normalizedRawValue = data.raw_value / data.max_value
        const normalizedRawValueTimeDecayedWeighted = timeDecayWeighted({ normalizedRawValue, day: data.day })

        return {
            normalizedRawValue: normalizedRawValueTimeDecayedWeighted,
            day: data.day,
        }
    })

    const topEntry = enriched.reduce((a, b) => (a.normalizedRawValue > b.normalizedRawValue ? a : b))
    const topThreshold = roundToTwoDecimals(Math.max(0, topEntry.normalizedRawValue - topThresholdNormalizedLowerBound))
    let topBand = enriched.filter((d) => d.normalizedRawValue >= topThreshold)

    if (!topBand.length) return { smartScore: 0, topBandDays: [] }

    // Only consider the topBandMaxLengthToConsider posts for the smart score calculation
    if (topBand.length > topBandMaxLengthToConsider) {
        topBand = topBand
            .sort((a, b) => b.normalizedRawValue - a.normalizedRawValue)
            .slice(0, topBandMaxLengthToConsider)
    }

    const topBandNormalizedTotal = roundToTwoDecimals(topBand.reduce((sum, d) => sum + d.normalizedRawValue, 0))
    const topBandNormalizedAverage = roundToTwoDecimals(topBandNormalizedTotal / topBand.length)

    const count = topBand.length

    let frequencyMultiplier = firstFrequencyMultiplierValue
    if (count >= lowerFrequencyMultiplierCount) {
        frequencyMultiplier = secondFrequencyMultiplierValue
    }
    if (count >= lowerFrequencyMultiplierCount && count < upperFrequencyMultiplierCount) {
        frequencyMultiplier = thirdFrequencyMultiplierValue
    }
    if (count >= upperFrequencyMultiplierCount) {
        frequencyMultiplier = 1.0
    }

    // Ensure the smart score is between 1 and maxValue as upper and lower bounds
    const smartScore = Math.min(
        maxValue,
        Math.max(1, Math.round(topBandNormalizedAverage * maxValue * frequencyMultiplier)),
    )

    // Extract the days that were in the top band
    const topBandDays = topBand.map((d) => d.day)

    return { smartScore, topBandDays }
}

module.exports = { calculateSmartScore }
