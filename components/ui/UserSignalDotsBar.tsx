"use client"

import { HStack, Box, Text } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"

export function UserSignalDotsBar({
    highCount,
    midCount,
    showHoverContent = false,
    showLabels = false,
    heightPx = 40,
}: {
    highCount: number
    midCount: number
    showHoverContent?: boolean
    showLabels?: boolean
    heightPx?: number
}) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [containerWidth, setContainerWidth] = useState<number>(0)

    useEffect(() => {
        if (!containerRef.current) return
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width
                setContainerWidth(width)
            }
        })
        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    const high = highCount || 0
    const mid = midCount || 0
    const total = Math.max(1, high + mid)
    const highPercent = (high / total) * 100
    const midPercent = (mid / total) * 100

    const DotGroup = ({
        type,
        count,
        color,
        widthPercent,
    }: {
        type: "high" | "mid"
        count: number
        color: string
        widthPercent: number
    }) => {
        const containerInnerWidth = Math.max(1, containerWidth - 40)
        const groupWidth = Math.max(1, (containerInnerWidth * widthPercent) / 100)

        if (count <= 0) {
            return null
        }

        const estimatedColumns = Math.ceil(Math.sqrt((count * groupWidth) / Math.max(1, heightPx)))
        const columns = Math.max(1, estimatedColumns)
        const cellSizeX = groupWidth / columns
        const rows = Math.max(1, Math.ceil(count / columns))
        const cellSizeY = heightPx / rows
        const cellSize = Math.max(1, Math.floor(Math.min(cellSizeX, cellSizeY)))

        const gap = Math.max(0, Math.floor(cellSize * 0.2))
        const dotSize = Math.max(1, cellSize - gap)

        return (
            <HStack
                h={`${heightPx}px`}
                w={`${widthPercent}%`}
                flexWrap="wrap"
                justifyContent="center"
                alignItems="center"
                alignContent="start"
                gap={`${gap}px`}
                position="relative"
            >
                {Array.from({ length: count }).map((_, i) => (
                    <Box
                        opacity={showHoverContent ? 0.1 : 1}
                        key={i}
                        boxSize={`${dotSize}px`}
                        borderRadius="full"
                        bg={color}
                    />
                ))}
                <HStack
                    position="absolute"
                    left={0}
                    top={0}
                    w="100%"
                    h="100%"
                    display={showHoverContent ? "flex" : "none"}
                    justifyContent="center"
                    alignItems="start"
                >
                    <Text
                        fontWeight="bold"
                        color={color}
                        lineHeight="1.2"
                        textAlign="center"
                        fontSize="sm"
                        whiteSpace="nowrap"
                    >
                        {type === "high" ? "High Signal" : "Mid Signal"}
                        <br /> Users
                    </Text>
                </HStack>
            </HStack>
        )
    }

    return (
        <HStack
            ref={containerRef as any}
            w="100%"
            h={`${heightPx}px`}
            gap={high < 10 || mid < 10 ? "20px" : "4px"}
            justifyContent="center"
            alignItems="center"
        >
            {high > 0 && <DotGroup type="high" count={high} color="green.500" widthPercent={highPercent} />}
            {mid > 0 && <DotGroup type="mid" count={mid} color="blue.500" widthPercent={midPercent} />}
        </HStack>
    )
}

export default UserSignalDotsBar
