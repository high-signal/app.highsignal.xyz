import { RawScore, SmartScoreOutput } from "./types";

/**
 * Calculates a deterministic "smart score" based on a user's recent raw scores.
 * This is a direct port of the legacy `calculateSmartScores.js` script.
 *
 * @param userData - An array of raw score data for a user.
 * @param previousDays - The number of previous days to consider (currently unused in the logic but kept for signature parity).
 * @returns An object containing the calculated smart score and the days included in the top band.
 */
export function calculateSmartScore(userData: RawScore[], previousDays: number): SmartScoreOutput {
    if (!userData || userData.length === 0) {
        return { smartScore: 0, topBandDays: [] };
    }

    const enriched = userData.map((d) => ({
        ...d,
        normalized: d.raw_value / d.max_value,
        time: new Date(d.day).getTime(),
    }));

    const topEntry = enriched.reduce((a, b) => (a.normalized > b.normalized ? a : b));
    const topThreshold = Math.max(0, topEntry.raw_value - topEntry.max_value * 0.3);
    let topBand = enriched.filter((d) => d.raw_value >= topThreshold);

    // Only consider the top 5 posts for the smart score calculation
    if (topBand.length > 5) {
        topBand = topBand.sort((a, b) => b.normalized - a.normalized).slice(0, 5);
    }

    if (topBand.length === 0) {
        return { smartScore: 0, topBandDays: [] };
    }

    const totalNormalizedScore = topBand.reduce((sum, d) => sum + d.normalized, 0);
    const averageNormalizedScore = totalNormalizedScore / topBand.length;

    const count = topBand.length;
    let multiplier = 0.5;
    if (count === 2) multiplier = 0.7;
    else if (count === 3 || count === 4) multiplier = 0.85;
    else if (count >= 5) multiplier = 1.0;

    const smartScore = Math.round(averageNormalizedScore * 100 * multiplier);

    // Extract the days that were in the top band
    const topBandDays = topBand.map((d) => d.day);

    return { smartScore, topBandDays };
}
