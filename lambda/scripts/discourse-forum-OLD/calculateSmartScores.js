function calculateSmartScore(userData, previousDays) {
    if (!userData.length) return 0

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
        }
    })

    const topEntry = enriched.reduce((a, b) => (a.normalized > b.normalized ? a : b))
    const topThreshold = Math.max(0, topEntry.raw_value - topEntry.max_value * 0.3)
    const topBand = enriched.filter((d) => d.raw_value >= topThreshold)

    if (!topBand.length) return 0

    const weightedSum = topBand.reduce((sum, d) => sum + d.normalized * d.timeWeight, 0)
    const totalWeight = topBand.reduce((sum, d) => sum + d.timeWeight, 0)
    const weightedAverage = weightedSum / totalWeight

    const count = topBand.length
    let multiplier = 0.5
    if (count === 2) multiplier = 0.7
    else if (count === 3 || count === 4) multiplier = 0.85
    else if (count >= 5) multiplier = 1.0

    const smartScore = Math.round(weightedAverage * 100 * multiplier)
    return smartScore
}

module.exports = { calculateSmartScore }
