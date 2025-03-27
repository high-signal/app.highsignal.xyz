export const formatNumber = (num: number): string => {
    if (num < 1000) return num.toString()
    if (num < 10000) return (num / 1000).toFixed(1) + "k"
    if (num < 1000000) return Math.floor(num / 1000) + "k"
    return (num / 1000000).toFixed(1) + "m"
}

export const generateSampleData = ({ maxValue }: { maxValue: number }) => {
    return Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)

        // 50% chance to be 0, otherwise a value between 1 and 2,000,000
        const randomValue = Math.random() < 0.5 ? 0 : Math.floor(Math.random() * maxValue - 1) + 1

        return {
            date: date.toISOString().split("T")[0],
            value: randomValue,
        }
    })
}
