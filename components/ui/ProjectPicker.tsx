import { HStack, Text, Box, Image, Spinner } from "@chakra-ui/react"
import { useState, useRef, useEffect } from "react"
import SingleLineTextInput from "./SingleLineTextInput"
import { useGetProjects } from "../../hooks/useGetProjects"
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
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("")
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null!)
    const { projects, loading, error } = useGetProjects(debouncedSearchTerm, true, isSuperAdminRequesting)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 200)
        return () => clearTimeout(timer)
    }, [searchTerm])

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
                    bg={selectorText && !isFocused ? "button.secondary.default" : "pageBackground"}
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
                    maxH="200px"
                    overflowY="auto"
                >
                    {loading ? (
                        <HStack w={"100%"} h={"30px"} ml={2}>
                            <Spinner />
                        </HStack>
                    ) : error ? (
                        <Text p={2} color="red.500">
                            Error loading projects
                        </Text>
                    ) : projects.length === 0 && searchTerm.length >= 1 ? (
                        <Text p={2}>No projects found</Text>
                    ) : (
                        projects.map((project) => (
                            <Box
                                key={project.urlSlug}
                                p={2}
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
                                <HStack>
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
                                    <Text>{project.displayName}</Text>
                                </HStack>
                            </Box>
                        ))
                    )}
                </Box>
            )}
        </Box>
    )
}
