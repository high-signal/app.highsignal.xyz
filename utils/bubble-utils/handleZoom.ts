import { useRef, useState, useEffect } from "react"

interface ZoomState {
    zoom: number
    transformOrigin: string
    isZooming: boolean
}

interface UseZoomProps {
    initialZoom: number
    maxZoom: number
    zoomStep: number
}

export function useZoom({ initialZoom, maxZoom, zoomStep }: UseZoomProps) {
    const [zoom, setZoom] = useState(initialZoom)
    const [transformOrigin, setTransformOrigin] = useState("center")
    const [isZooming, setIsZooming] = useState(false)
    const zoomRef = useRef(zoom)
    const containerRef = useRef<HTMLDivElement>(null)

    // Update zoom ref when zoom state changes
    useEffect(() => {
        zoomRef.current = zoom
    }, [zoom])

    const handleWheel = (event: WheelEvent) => {
        if (!containerRef.current) return
        event.preventDefault()
        const currentZoom = zoomRef.current
        const delta = event.deltaY

        if (delta < 0) {
            // Get mouse position relative to the container
            const rect = containerRef.current.getBoundingClientRect()
            const x = event.clientX - rect.left
            const y = event.clientY - rect.top

            // Calculate percentage position
            const xPercent = (x / rect.width) * 100
            const yPercent = (y / rect.height) * 100

            // Set transform origin to mouse position
            setTransformOrigin(`${xPercent}% ${yPercent}%`)
        }

        let newZoom = currentZoom
        if (delta > 0) {
            newZoom = currentZoom - zoomStep
        } else {
            newZoom = currentZoom + zoomStep
        }

        if (newZoom <= initialZoom) {
            // Reset transform origin to center when fully zoomed out
            setTransformOrigin("center")
            setZoom(initialZoom)
        } else if (newZoom >= maxZoom) {
            setZoom(maxZoom)
        } else {
            setZoom(Number(newZoom.toFixed(3)))
        }

        setIsZooming(true)
        // Reset zooming state after animation
        setTimeout(() => setIsZooming(false), 500)
    }

    return {
        zoom,
        transformOrigin,
        isZooming,
        handleWheel,
        containerRef,
    }
}
