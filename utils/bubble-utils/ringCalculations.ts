type SignalType = "high" | "mid" | "low"

interface User {
    username: string
    profileImageUrl?: string
    signal: "high" | "mid" | "low"
}

interface Ring {
    radius: number
    count: number
}

interface RingCalculationParams {
    users: User[]
    bodyRadius: number
    minSpacing: number
    boxSize: number
}

interface RingCalculationResult {
    allRings: Ring[]
    center: { x: number; y: number }
    innerRadius: number
    maxRadius: number
}

export function calculateRings({
    users,
    bodyRadius,
    minSpacing,
    boxSize,
}: RingCalculationParams): RingCalculationResult {
    const center = { x: boxSize / 2, y: boxSize / 2 }
    const innerRadius = boxSize / 2 + bodyRadius * 5 // Start from center
    const maxRadius = (boxSize / 2) * 1.8 // Allow expansion outward

    // Group users by signal type
    const highSignalUsers = users.filter((user) => user.signal === "high")
    const midSignalUsers = users.filter((user) => user.signal === "mid")
    const lowSignalUsers = users.filter((user) => user.signal === "low")

    // Calculate rings for each signal type with better spacing
    const calculateRingsForSignalType = (users: User[], startRadius: number, endRadius: number) => {
        let remainingCircles = users.length
        let currentRadius = startRadius
        const rings: Ring[] = []

        // Calculate total available space for this signal type
        const totalSpace = endRadius - startRadius
        const maxRings = Math.floor(totalSpace / (bodyRadius * 2 + minSpacing))

        // Calculate how many circles should be in each ring
        const circlesPerRing = Math.ceil(users.length / maxRings)

        while (remainingCircles > 0 && currentRadius <= endRadius) {
            const circlesToAdd = Math.min(circlesPerRing, remainingCircles)
            if (circlesToAdd > 0) {
                rings.push({ radius: currentRadius, count: circlesToAdd })
                remainingCircles -= circlesToAdd
            }
            currentRadius += bodyRadius * 2 + minSpacing
        }

        return rings
    }

    // Calculate target radii for each signal type
    const highEndRadius = innerRadius + (maxRadius - innerRadius) * 0.33
    const midEndRadius = innerRadius + (maxRadius - innerRadius) * 0.66

    // Calculate rings for each signal type
    const highSignalRings = calculateRingsForSignalType(highSignalUsers, innerRadius, highEndRadius)
    const midSignalRings = calculateRingsForSignalType(
        midSignalUsers,
        highEndRadius + bodyRadius * 2 + minSpacing,
        midEndRadius,
    )
    const lowSignalRings = calculateRingsForSignalType(
        lowSignalUsers,
        midEndRadius + bodyRadius * 2 + minSpacing,
        maxRadius,
    )

    // Combine all rings
    const allRings = [...highSignalRings, ...midSignalRings, ...lowSignalRings]

    return {
        allRings,
        center,
        innerRadius,
        maxRadius,
    }
}
