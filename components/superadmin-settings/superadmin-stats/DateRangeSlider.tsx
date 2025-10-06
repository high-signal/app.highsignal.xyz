"use client"

import { useState, useEffect } from "react"
import { Box, Flex, useToken } from "@chakra-ui/react"
import { Slider } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBars } from "@fortawesome/free-solid-svg-icons"

interface DateRangeSliderProps {
    onSliderCommit: (values: number[]) => void
    initialValues: number[]
    max: number
    getDateRange: string[]
}

export default function DateRangeSlider({ onSliderCommit, initialValues, max, getDateRange }: DateRangeSliderProps) {
    const [sliderValues, setSliderValues] = useState(initialValues)

    // Update local state when initialValues change
    useEffect(() => {
        setSliderValues(initialValues)
    }, [initialValues])

    const handleSliderChange = (newValues: number[]) => {
        let [firstValue, secondValue] = newValues

        if (secondValue - firstValue < 1) {
            if (sliderValues[0] === firstValue) {
                secondValue = firstValue + 1
            } else {
                firstValue = secondValue - 1
            }
        }
        setSliderValues([firstValue, secondValue])
    }

    // Debounce the callback to parent
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onSliderCommit(sliderValues)
        }, 500) // 500ms delay

        return () => clearTimeout(timeoutId)
    }, [sliderValues, onSliderCommit])

    // Format date for display
    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    }

    return (
        <Box width="100%" borderRadius={{ base: "0px", sm: "16px" }} pt={12} pb={3} px={{ base: 1, sm: 2 }}>
            <Flex direction="row" justifyContent="center" alignItems="center" px={{ base: 4, sm: 0 }}>
                <Slider.Root
                    value={sliderValues}
                    min={0}
                    max={max}
                    step={1}
                    onValueChange={({ value }) => handleSliderChange(value)}
                    width="100%"
                    bg={"contentBackground"}
                    py={2}
                    px={2}
                    borderRadius={"full"}
                >
                    <Slider.Control cursor="pointer">
                        <Slider.Track height="10px" borderRadius="5px" bg={"pageBackground"}>
                            <Slider.Range bg={"teal.500"} />
                        </Slider.Track>
                        <Slider.Thumb
                            index={0}
                            boxSize={6}
                            cursor="pointer"
                            bg={"teal.500"}
                            border="2px solid"
                            borderColor="teal.500"
                        >
                            <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)">
                                <FontAwesomeIcon icon={faBars} color="white" size="sm" />
                            </Box>
                            <Box
                                position="absolute"
                                top="-37px"
                                left="50%"
                                transform="translateX(-50%)"
                                bg={"pageBackground"}
                                borderRadius={"full"}
                                px={2}
                                py={1}
                                fontSize="xs"
                                fontWeight="bold"
                                whiteSpace="nowrap"
                            >
                                {getDateRange[sliderValues[0]]
                                    ? formatDate(new Date(getDateRange[sliderValues[0]]))
                                    : ""}
                            </Box>
                        </Slider.Thumb>
                        <Slider.Thumb
                            index={1}
                            boxSize={6}
                            cursor="pointer"
                            bg={"teal.500"}
                            border="2px solid"
                            borderColor="teal.500"
                        >
                            <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)">
                                <FontAwesomeIcon icon={faBars} color="white" size="sm" />
                            </Box>
                            <Box
                                position="absolute"
                                top="-37px"
                                left="50%"
                                transform="translateX(-50%)"
                                bg={"pageBackground"}
                                borderRadius={"full"}
                                px={2}
                                py={1}
                                fontSize="xs"
                                fontWeight="bold"
                                whiteSpace="nowrap"
                            >
                                {getDateRange[sliderValues[1]]
                                    ? formatDate(new Date(getDateRange[sliderValues[1]]))
                                    : ""}
                            </Box>
                        </Slider.Thumb>
                    </Slider.Control>
                </Slider.Root>
            </Flex>
        </Box>
    )
}
