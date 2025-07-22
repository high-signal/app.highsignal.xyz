function calculateSmartScore(userData, previousDays, maxValue) {
    if (!userData.length) return { smartScore: 0, topBandDays: [] }

    const now = Date.now()
    const MS_PER_DAY = 86400000
    const startTime = now - previousDays * MS_PER_DAY

    const decayDuration = 0.3 // final 30% of period decays to 0
    const decayStart = startTime + previousDays * (1 - decayDuration) * MS_PER_DAY

    // function getTimeMultiplier(timestamp) {
    //     if (timestamp >= decayStart) {
    //         return 1
    //     } else {
    //         const percent = 1 - (timestamp - decayStart) / (now - decayStart)
    //         return Math.max(0, percent)
    //     }
    // }

    const enriched = userData.map((d) => {
        const time = new Date(d.day).getTime()
        const normalized = d.raw_value / d.max_value
        // const timeWeight = getTimeMultiplier(time)
        return {
            raw_value: d.raw_value,
            max_value: d.max_value,
            normalized,
            time,
            timeWeight: 1,
            day: d.day,
        }
    })

    const topEntry = enriched.reduce((a, b) => (a.normalized > b.normalized ? a : b))
    const topThreshold = Math.max(0, topEntry.raw_value - topEntry.max_value * 0.3)
    let topBand = enriched.filter((d) => d.raw_value >= topThreshold)

    // Only consider the top 5 posts for the smart score calculation
    if (topBand.length > 5) {
        topBand = topBand.sort((a, b) => b.normalized - a.normalized).slice(0, 5)
    }

    if (!topBand.length) return { smartScore: 0, topBandDays: [] }

    const weightedSum = topBand.reduce((sum, d) => sum + d.normalized * d.timeWeight, 0)
    const totalWeight = topBand.reduce((sum, d) => sum + d.timeWeight, 0)
    const weightedAverage = weightedSum / totalWeight

    const count = topBand.length
    let multiplier = 0.5
    if (count === 2) multiplier = 0.7
    else if (count === 3 || count === 4) multiplier = 0.85
    else if (count >= 5) multiplier = 1.0

    const smartScore = Math.round(weightedAverage * maxValue * multiplier)

    // Extract the days that were in the top band
    const topBandDays = topBand.map((d) => d.day)

    return { smartScore, topBandDays }
}

module.exports = { calculateSmartScore }
