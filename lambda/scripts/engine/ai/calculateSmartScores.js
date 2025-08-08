function calculateSmartScore(userData, previousDays, maxValue) {
    if (!userData.length) return { smartScore: 0, topBandDays: [] }

    const TOP_THRESHOLD_PERCENT = 0.3
    const TOP_BAND_MAX_LENGTH_TO_CONSIDER = 5
    const LOWER_FREQUENCY_MULTIPLIER_COUNT = 2
    const UPPER_FREQUENCY_MULTIPLIER_COUNT = 5
    const TIME_DECAY_PERCENT = 0.3 // final 30% of period decays to 0

    const roundToTwoDecimals = (value) => {
        return Math.round(value * 100) / 100
    }

    // If the day is within the last TIME_DECAY_PERCENT of the period,
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

        const decayStartDay = Math.floor(previousDays * (1 - TIME_DECAY_PERCENT))

        let timeDecayMultiplier = 1

        // TODO: This is commented out for regression testing on staging
        // if (ageInDays > decayStartDay) {
        //     const decayProgress = (ageInDays - decayStartDay) / (previousDays - decayStartDay)
        //     timeDecayMultiplier = 1 - decayProgress
        // }

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
    const topThreshold = roundToTwoDecimals(Math.max(0, topEntry.normalizedRawValue - TOP_THRESHOLD_PERCENT))
    let topBand = enriched.filter((d) => d.normalizedRawValue >= topThreshold)

    if (!topBand.length) return { smartScore: 0, topBandDays: [] }

    // Only consider the TOP_BAND_MAX_LENGTH_TO_CONSIDER posts for the smart score calculation
    if (topBand.length > TOP_BAND_MAX_LENGTH_TO_CONSIDER) {
        topBand = topBand
            .sort((a, b) => b.normalizedRawValue - a.normalizedRawValue)
            .slice(0, TOP_BAND_MAX_LENGTH_TO_CONSIDER)
    }

    const topBandNormalizedTotal = roundToTwoDecimals(topBand.reduce((sum, d) => sum + d.normalizedRawValue, 0))
    const topBandNormalizedAverage = roundToTwoDecimals(topBandNormalizedTotal / topBand.length)

    const count = topBand.length
    let frequencyMultiplier = 0.5
    if (count === LOWER_FREQUENCY_MULTIPLIER_COUNT) {
        frequencyMultiplier = 0.7
    } else if (count > LOWER_FREQUENCY_MULTIPLIER_COUNT && count < UPPER_FREQUENCY_MULTIPLIER_COUNT) {
        frequencyMultiplier = 0.85
    } else if (count >= UPPER_FREQUENCY_MULTIPLIER_COUNT) {
        frequencyMultiplier = 1.0
    }

    const smartScore = Math.round(topBandNormalizedAverage * maxValue * frequencyMultiplier)

    // Extract the days that were in the top band
    const topBandDays = topBand.map((d) => d.day)

    return { smartScore, topBandDays }
}

module.exports = { calculateSmartScore }
