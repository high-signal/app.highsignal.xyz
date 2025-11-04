"use client"

import { HStack, Text, Box, Image, Spinner } from "@chakra-ui/react"
import { useState, useRef, useEffect } from "react"
import SingleLineTextInput from "./SingleLineTextInput"
import { useGetProjects } from "../../hooks/useGetProjects"
import { useDebounce } from "../../hooks/useDebounce"
import { ASSETS } from "../../config/constants"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronDown } from "@fortawesome/free-solid-svg-icons"

interface ProjectPickerProps {
    onProjectSelect: (project: ProjectData) => void
    onClear?: () => void
    selectorText?: string
    placeholder?: string
    isSuperAdminRequesting?: boolean
}

export default function ProjectPicker({
    onProjectSelect,
    onClear,
    selectorText,
    placeholder = "Search projects...",
    isSuperAdminRequesting = false,
}: ProjectPickerProps) {
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null!)

    // Use the proper debounce hook with a 300ms delay for better UX
    const debouncedSearchTerm = useDebounce(searchTerm, 300)

    const { projects, loading, error } = useGetProjects(debouncedSearchTerm, true, isSuperAdminRequesting)

    return (
        <Box position="relative" minW={{ base: "100%", sm: "max-content" }} flexGrow={1}>
            <Box position="relative">
                <SingleLineTextInput
                    ref={inputRef}
                    placeholder={placeholder}
                    value={selectorText && !isFocused ? selectorText : searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value)
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                        if (selectorText) {
                            setSearchTerm("")
                        }
                        setTimeout(() => {
                            setIsFocused(false)
                        }, 50)
                    }}
                    {...(!selectorText && {
                        handleClear: () => {
                            setSearchTerm("")
                            if (onClear) {
                                onClear()
                            }
                        },
                    })}
                    isSelectorOnly={Boolean(selectorText)}
                    bg={"pageBackground"}
                    borderColor={"button.secondary.default"}
                />
                {selectorText && !isFocused && (
                    <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" pointerEvents="none">
                        <FontAwesomeIcon icon={faChevronDown} />
                    </Box>
                )}
            </Box>
            {isFocused && (
                <Box
                    position="absolute"
                    top="100%"
                    left={0}
                    right={0}
                    mt={1}
                    bg="pageBackground"
                    borderWidth={3}
                    borderColor="contentBorder"
                    borderRadius="16px"
                    boxShadow="md"
                    zIndex={5}
                    maxH="50dvh"
                    minH="45px"
                    overflowY="auto"
                >
                    {loading ? (
                        <HStack w={"100%"} h={"30px"} ml={2} mt={1} mb={"7px"}>
                            <Spinner />
                        </HStack>
                    ) : error ? (
                        <Text p={2} color="red.500">
                            Error loading projects
                        </Text>
                    ) : projects.length === 0 && searchTerm.length >= 1 ? (
                        <Text p={2}>No projects found</Text>
                    ) : (
                        projects
                            .sort((a, b) => {
                                const scoreA = a.averageScore ?? 0
                                const scoreB = b.averageScore ?? 0
                                // Sort by averageScore (descending), then by displayName
                                if (scoreA !== scoreB) {
                                    return scoreB - scoreA
                                }
                                return (a.displayName || "").localeCompare(b.displayName || "")
                            })
                            .map((project) => (
                                <Box
                                    key={project.urlSlug}
                                    pl={2}
                                    pr={"6px"}
                                    py={1}
                                    cursor="pointer"
                                    _hover={{ bg: "contentBackground" }}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        setSearchTerm(project.displayName)
                                        setIsFocused(false)
                                        inputRef.current?.blur()
                                        onProjectSelect(project)
                                    }}
                                >
                                    <HStack w="100%">
                                        <Image
                                            src={
                                                !project.projectLogoUrl || project.projectLogoUrl === ""
                                                    ? ASSETS.DEFAULT_PROFILE_IMAGE
                                                    : project.projectLogoUrl
                                            }
                                            alt={`${project.displayName} Logo`}
                                            fit="cover"
                                            transition="transform 0.2s ease-in-out"
                                            w="25px"
                                            borderRadius="full"
                                        />
                                        <HStack w="100%" justifyContent="space-between">
                                            <Text>{project.displayName}</Text>
                                            <Text
                                                fontSize="sm"
                                                fontWeight="bold"
                                                border="3px solid"
                                                borderColor="green.500"
                                                borderRadius="full"
                                                px={2}
                                                py={"2px"}
                                                textAlign="center"
                                                minW={"40px"}
                                            >
                                                {project.averageScore?.toFixed(0)}
                                            </Text>
                                        </HStack>
                                    </HStack>
                                </Box>
                            ))
                    )}
                </Box>
            )}
        </Box>
    )
}
