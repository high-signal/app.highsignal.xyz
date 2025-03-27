export type DataItem = {
    date: string
    value: number
}

export type ConfigItem = {
    title: {
        text: string
        emoji: string
    }
    link: string
    emoji: string
    type: string
    data: DataItem[]
}

export type DataStructure = {
    [key: string]: ConfigItem[]
}

export type DateRangeItem = {
    date: string
}
