"use client"

import { HStack, VStack, Box, Text, useBreakpointValue } from "@chakra-ui/react"
import { useEffect, useRef, useState, memo } from "react"

const DotGroup = memo(function DotGroup({
    type,
    count,
    color,
    widthPercent,
    startIndex,
    totalDots,
    animationKey,
    isMounted,
    heightPx,
    containerWidth,
    showHoverContent,
    showLabels,
    labelHeight,
}: {
    type: "high" | "mid"
    count: number
    color: string
    widthPercent: number
    startIndex: number
    totalDots: number
    animationKey: number
    isMounted: boolean
    heightPx: number
    containerWidth: number
    showHoverContent: boolean
    showLabels: boolean
    labelHeight: number
}) {
    const dotRefs = useRef<(HTMLDivElement | null)[]>([])
    const textRef = useRef<HTMLDivElement | null>(null)

    const containerInnerWidth = Math.max(1, containerWidth - 40)
    const groupWidth = Math.max(1, (containerInnerWidth * widthPercent) / 100)
    const isBaseBreakpoint = useBreakpointValue({ base: true, sm: false })
    const durationMs = 1000
    const transitionMs = 500

    // Staggered animation on mount or animationKey change
    useEffect(() => {
        if (!isMounted) return

        const timeouts: NodeJS.Timeout[] = []
        for (let i = 0; i < count; i++) {
            const delayMs = ((startIndex + i) * (durationMs - transitionMs)) / Math.max(1, totalDots - 1)
            const timeout = setTimeout(() => {
                const el = dotRefs.current[i]
                if (el) el.style.opacity = "1"
            }, delayMs)
            timeouts.push(timeout)
        }

        return () => timeouts.forEach(clearTimeout)
    }, [count, startIndex, totalDots, durationMs, transitionMs, animationKey, isMounted])

    // Smooth opacity update on hover toggle
    useEffect(() => {
        const finalOpacity = showHoverContent ? 0.1 : 1
        dotRefs.current.forEach((el) => {
            if (el) {
                el.style.transition = "opacity 0.2s ease-in-out"
                el.style.opacity = String(finalOpacity)
            }
        })
        if (textRef.current) {
            textRef.current.style.transition = showHoverContent
                ? "opacity 0.3s ease-in-out"
                : "opacity 0.2s ease-in-out"
            textRef.current.style.opacity = showHoverContent ? "1" : "0"
        }
    }, [showHoverContent])

    if (count <= 0) return null

    const estimatedColumns = Math.ceil(Math.sqrt((count * groupWidth) / Math.max(1, heightPx)))
    const columns = Math.max(1, estimatedColumns)
    const cellSizeX = groupWidth / columns
    const rows = Math.max(1, Math.ceil(count / columns))
    const cellSizeY = heightPx / rows
    const cellSize = Math.max(1, Math.floor(Math.min(cellSizeX, cellSizeY)))
    const gap = Math.max(0, Math.floor(cellSize * 0.2))
    const dotSize = Math.max(1, cellSize - gap)

    const labelAlign = showLabels && type === "high" && (isBaseBreakpoint ?? true) ? "start" : "center"

    return (
        <VStack
            w={`${widthPercent}%`}
            h={`${heightPx + labelHeight}px`}
            justifyContent={{ base: "end", sm: "space-around" }}
            gap={0}
        >
            {showLabels && (
                <Text
                    fontWeight="bold"
                    color={color}
                    lineHeight="1.2"
                    textAlign={labelAlign}
                    w={"100%"}
                    fontSize="sm"
                    whiteSpace="nowrap"
                >
                    {type === "high" ? "High Signal" : "Mid Signal"} Users
                </Text>
            )}
            <HStack
                h={`${heightPx}px`}
                flexWrap="wrap"
                justifyContent="center"
                alignItems="center"
                alignContent={showLabels ? "end" : "start"}
                gap={`${gap}px`}
                position="relative"
            >
                {Array.from({ length: count }).map((_, i) => (
                    <Box
                        key={`${animationKey}-${i}`}
                        ref={(el: HTMLDivElement | null) => (dotRefs.current[i] = el)}
                        boxSize={`${dotSize}px`}
                        borderRadius="full"
                        bg={color}
                        style={{
                            opacity: 0,
                            transition: "opacity 0.1s ease-in-out",
                        }}
                    />
                ))}
                <HStack
                    ref={textRef}
                    position="absolute"
                    left={0}
                    top={0}
                    w="100%"
                    h="100%"
                    justifyContent="center"
                    alignItems="start"
                    opacity={0}
                    pointerEvents="none"
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
        </VStack>
    )
})

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
    const [animationKey, setAnimationKey] = useState<number>(0)
    const [isMounted, setIsMounted] = useState(false)

    const responsiveLabelHeight = useBreakpointValue({ base: 20, sm: 20 })
    const labelHeight = showLabels ? (responsiveLabelHeight ?? 20) : 0

    useEffect(() => {
        setIsMounted(false)
        setAnimationKey((prev) => prev + 1)
        const timer = setTimeout(() => setIsMounted(true), 100)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (!containerRef.current) return
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width)
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

    return (
        <HStack
            ref={containerRef as any}
            w="100%"
            h={`${heightPx + (labelHeight || 0)}px`}
            gap={high < 10 || mid < 10 ? "20px" : "4px"}
            justifyContent="center"
            alignItems="center"
            cursor={showLabels ? "default" : "pointer"}
        >
            {high > 0 && (
                <DotGroup
                    type="high"
                    count={high}
                    color="green.500"
                    widthPercent={highPercent}
                    startIndex={0}
                    totalDots={total}
                    animationKey={animationKey}
                    isMounted={isMounted}
                    heightPx={heightPx}
                    containerWidth={containerWidth}
                    showHoverContent={showHoverContent}
                    showLabels={showLabels}
                    labelHeight={labelHeight || 0}
                />
            )}
            {mid > 0 && (
                <DotGroup
                    type="mid"
                    count={mid}
                    color="blue.500"
                    widthPercent={midPercent}
                    startIndex={high}
                    totalDots={total}
                    animationKey={animationKey}
                    isMounted={isMounted}
                    heightPx={heightPx}
                    containerWidth={containerWidth}
                    showHoverContent={showHoverContent}
                    showLabels={showLabels}
                    labelHeight={labelHeight || 0}
                />
            )}
        </HStack>
    )
}

export default UserSignalDotsBar
