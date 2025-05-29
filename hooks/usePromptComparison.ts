import { useState, useRef, useEffect } from "react"
import { diff_match_patch } from "diff-match-patch"

interface UsePromptComparisonProps {
    currentPrompt: string | undefined
    newPrompt: string | undefined
}

interface UsePromptComparisonReturn {
    isPromptExpanded: boolean
    setIsPromptExpanded: (expanded: boolean) => void
    currentPromptRef: React.RefObject<HTMLDivElement | null>
    newPromptRef: React.RefObject<HTMLTextAreaElement | null>
    currentPromptTextAreaHeight: string | { base: string; sm: string }
    newPromptTextAreaHeight: string | { base: string; sm: string }
    diffs: [number, string][]
}

export function usePromptComparison({ currentPrompt, newPrompt }: UsePromptComparisonProps): UsePromptComparisonReturn {
    const [isPromptExpanded, setIsPromptExpanded] = useState(false)
    const [expandedHeight, setExpandedHeight] = useState<number | null>(null)
    const currentPromptRef = useRef<HTMLDivElement | null>(null)
    const newPromptRef = useRef<HTMLTextAreaElement | null>(null)
    const currentPromptHeightRef = useRef<number>(0)
    const newPromptHeightRef = useRef<number>(0)

    // Text area height calculations
    const currentPromptTextAreaHeight = isPromptExpanded
        ? {
              base: `${currentPromptHeightRef.current}px`,
              sm: expandedHeight ? `${expandedHeight}px` : "fit-content",
          }
        : "30dvh"

    const newPromptTextAreaHeight = isPromptExpanded
        ? {
              base: `${newPromptHeightRef.current + 20}px`,
              sm: expandedHeight ? `${expandedHeight}px` : "fit-content",
          }
        : "30dvh"

    // Diff between current prompt and new prompt
    const [diffs, setDiffs] = useState<[number, string][]>([])

    // Calculate diff between current prompt and new prompt
    useEffect(() => {
        if (currentPrompt && newPrompt) {
            const dmp = new diff_match_patch()
            const newDiffs = dmp.diff_main(currentPrompt, newPrompt)
            dmp.diff_cleanupSemantic(newDiffs)
            setDiffs(newDiffs)
        } else {
            setDiffs([])
        }
    }, [currentPrompt, newPrompt])

    // Update expanded height when content changes
    useEffect(() => {
        if (isPromptExpanded) {
            const currentHeight = currentPromptRef.current?.scrollHeight || 0
            const newHeight = newPromptRef.current?.scrollHeight || 0
            currentPromptHeightRef.current = currentHeight
            newPromptHeightRef.current = newHeight
            setExpandedHeight(Math.max(currentHeight, newHeight))
        }
    }, [isPromptExpanded, currentPrompt, newPrompt])

    return {
        isPromptExpanded,
        setIsPromptExpanded,
        currentPromptRef,
        newPromptRef,
        currentPromptTextAreaHeight,
        newPromptTextAreaHeight,
        diffs,
    }
}
