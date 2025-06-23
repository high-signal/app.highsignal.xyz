"use client"

import { useState, useEffect } from "react"
import { HStack, Button, Text, VStack } from "@chakra-ui/react"
import SingleLineTextInput from "../ui/SingleLineTextInput"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons"

interface LeaderboardPaginationProps {
    page: number
    maxPage: number
    onPageChange: (page: number) => void
}

export default function LeaderboardPagination({ page, maxPage, onPageChange }: LeaderboardPaginationProps) {
    const [inputValue, setInputValue] = useState(page.toString())
    const [isInvalid, setIsInvalid] = useState(false)

    // Update input value when page prop changes
    useEffect(() => {
        setInputValue(page.toString())
    }, [page])

    // Debounce the input value
    useEffect(() => {
        const timer = setTimeout(() => {
            const newPage = parseInt(inputValue)
            if (!isNaN(newPage) && newPage >= 1 && newPage <= maxPage) {
                setIsInvalid(false)
                if (newPage !== page) {
                    onPageChange(newPage)
                }
            } else {
                setIsInvalid(true)
            }
        }, 500) // 500ms debounce

        return () => clearTimeout(timer)
    }, [inputValue, maxPage, onPageChange, page])

    const handlePrevPage = () => {
        if (page > 1) {
            onPageChange(page - 1)
        }
    }

    const handleNextPage = () => {
        if (page < maxPage) {
            onPageChange(page + 1)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
    }

    const PaginationButton = ({
        children,
        onClick,
        disabled,
    }: {
        children: React.ReactNode
        onClick: () => void
        disabled: boolean
    }) => {
        return (
            <Button
                secondaryButton
                onClick={onClick}
                disabled={disabled}
                py={1}
                px={{ base: 2, md: 6 }}
                borderRadius="full"
                h={"35px"}
            >
                {children}
            </Button>
        )
    }

    return (
        <VStack>
            <HStack gap={{ base: 2, sm: 4 }} justify="space-around" mt={5} w={"100%"}>
                <PaginationButton onClick={handlePrevPage} disabled={page <= 1}>
                    <HStack gap={2} pl={2} pr={4}>
                        <FontAwesomeIcon icon={faChevronLeft} />
                        <Text>Previous</Text>
                    </HStack>
                </PaginationButton>
                <HStack gap={2}>
                    <SingleLineTextInput
                        value={inputValue}
                        onChange={handleInputChange}
                        maxW={"50px"}
                        isEditable={maxPage > 1}
                    />
                    <Text color="textColorMuted">of</Text>
                    <Text color="textColorMuted">{maxPage}</Text>
                </HStack>
                <PaginationButton onClick={handleNextPage} disabled={page >= maxPage}>
                    <HStack gap={2} pl={4} pr={2}>
                        <Text>Next</Text>
                        <FontAwesomeIcon icon={faChevronRight} />
                    </HStack>
                </PaginationButton>
            </HStack>
            {isInvalid && (
                <Text color="orange.500" fontSize="sm">
                    Please enter a valid page number
                </Text>
            )}
        </VStack>
    )
}
