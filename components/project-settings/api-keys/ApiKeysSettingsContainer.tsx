"use client"

import { Box, Button, HStack, Link, Text, VStack } from "@chakra-ui/react"
import SettingsSectionContainer from "../../ui/SettingsSectionContainer"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheckCircle, faCopy, faExternalLink, faKey, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons"
import { useState } from "react"
import ApiKeyConfirmationModal from "./ApiKeyConfirmationModal"

export default function ApiKeysSettingsContainer({
    project,
    setTriggerProjectRefetch,
}: {
    project: ProjectData
    setTriggerProjectRefetch: (trigger: boolean) => void
}) {
    const [isCopied, setIsCopied] = useState(false)
    const [showGenerateModal, setShowGenerateModal] = useState(false)
    const [showRevokeModal, setShowRevokeModal] = useState(false)

    // Copy the address to the clipboard
    const handleCopyApiKey = async () => {
        try {
            if (!project.apiKey) {
                throw new Error("API does not exist")
            }
            await navigator.clipboard.writeText(project.apiKey)
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy address:", err)
        }
    }

    const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/users/?apiKey=${project.apiKey}&project=${project.urlSlug}&page=1`

    const handleApiKeyGeneration = async () => {
        console.log("Generating API key")
        setTriggerProjectRefetch(true)
    }

    const handleGenerateNewApiKey = async () => {
        console.log("Generating new API key")
        setTriggerProjectRefetch(true)
    }

    const handleRevokeApiKey = async () => {
        console.log("Revoking API key")
        setTriggerProjectRefetch(true)
    }

    return (
        <SettingsSectionContainer>
            <VStack
                bg={"contentBackground"}
                borderRadius={{ base: "0px", sm: "16px" }}
                w={"500px"}
                maxW={"100%"}
                gap={4}
                px={5}
                py={4}
            >
                <Text w={"100%"}>
                    {project.apiKey ? "Use this" : "Generate an"} API key to access Ethereum addresses users have shared
                    with {project.displayName}.
                </Text>

                {project.apiKey ? (
                    <>
                        <VStack maxW={"100%"} gap={0} alignItems={"start"}>
                            <Text bg={"pageBackground"} px={5} pt={"6px"} borderTopRadius={"16px"} fontWeight={"bold"}>
                                {project.displayName} API key
                            </Text>
                            <HStack
                                bg={"pageBackground"}
                                borderRadius={"full"}
                                borderTopLeftRadius={0}
                                gap={0}
                                justifyContent={"space-between"}
                                h={"36px"}
                                maxW={"100%"}
                                pl={3}
                            >
                                <Text
                                    fontSize={"md"}
                                    fontFamily={"monospace"}
                                    overflowX="auto"
                                    whiteSpace="nowrap"
                                    p={2}
                                    py={2}
                                    flex={1}
                                >
                                    {project.apiKey}
                                </Text>
                                <Button
                                    secondaryButton
                                    onClick={handleCopyApiKey}
                                    borderRightRadius={"35px"}
                                    borderLeftRadius={0}
                                    w={"92px"}
                                    pl={2}
                                    pr={3}
                                    py={1}
                                    h={"36px"}
                                >
                                    <HStack gap={1} w={"100%"} justifyContent={"center"}>
                                        <FontAwesomeIcon icon={isCopied ? faCheckCircle : faCopy} />
                                        <Text fontSize="sm" fontWeight="bold">
                                            {isCopied ? "Copied" : "Copy"}
                                        </Text>
                                    </HStack>
                                </Button>
                            </HStack>
                        </VStack>
                        <HStack
                            flexWrap={"wrap"}
                            justifyContent={"space-around"}
                            alignItems={"center"}
                            gap={2}
                            w={"100%"}
                        >
                            <Button
                                secondaryButton
                                borderRadius={"full"}
                                px={4}
                                py={2}
                                fontWeight={"bold"}
                                onClick={() => setShowGenerateModal(true)}
                            >
                                <FontAwesomeIcon icon={faKey} />
                                <Text>Generate a new API Key</Text>
                            </Button>
                            <Button
                                dangerButton
                                borderRadius={"full"}
                                px={4}
                                py={2}
                                fontWeight={"bold"}
                                onClick={() => setShowRevokeModal(true)}
                            >
                                <FontAwesomeIcon icon={faTriangleExclamation} />
                                <Text>Revoke API Key</Text>
                            </Button>
                        </HStack>
                        <VStack maxW={"100%"} gap={2} alignItems={"start"} pt={2}>
                            <Box w={"100%"} h={"1px"} borderTop="5px dashed" borderColor="contentBorder" pb={3} />
                            <Text w={"100%"}>Use this API with pagination to fetch all addresses</Text>
                            <HStack>
                                <Text>URL Path:</Text>
                                <Text
                                    bg={"pageBackground"}
                                    px={3}
                                    py={1}
                                    borderRadius={"full"}
                                >{`${process.env.NEXT_PUBLIC_SITE_URL}/api/users/?`}</Text>
                            </HStack>
                            <HStack>
                                <Text>URL Params:</Text>
                                <Text
                                    bg={"pageBackground"}
                                    px={3}
                                    py={1}
                                    borderRadius={"full"}
                                >{`apiKey=<YOUR_API_KEY>`}</Text>
                            </HStack>
                            <HStack>
                                <Text>URL Params:</Text>
                                <Text
                                    bg={"pageBackground"}
                                    px={3}
                                    py={1}
                                    borderRadius={"full"}
                                >{`project=${project.urlSlug}`}</Text>
                            </HStack>
                            <HStack>
                                <Text>URL Params:</Text>
                                <Text bg={"pageBackground"} px={3} py={1} borderRadius={"full"}>{`page=1`}</Text>
                            </HStack>
                            <Link href={apiUrl} target="_blank" textDecoration={"none"} maxW={"500px"}>
                                <Button
                                    secondaryButton
                                    px={3}
                                    py={1}
                                    borderRadius={"16px"}
                                    maxW={"500px"}
                                    h="auto"
                                    whiteSpace="normal"
                                    textAlign="center"
                                >
                                    <Text
                                        lineBreak={"anywhere"}
                                        maxW={"500px"}
                                        wordBreak="break-all"
                                        whiteSpace="normal"
                                        overflowWrap="break-word"
                                    >
                                        {apiUrl}
                                    </Text>
                                    <FontAwesomeIcon icon={faExternalLink} size="lg" />
                                </Button>
                            </Link>
                            <Text>Example Response:</Text>
                            <Text
                                bg={"pageBackground"}
                                px={3}
                                py={2}
                                borderRadius={"8px"}
                                fontFamily={"monospace"}
                                fontSize={"sm"}
                                whiteSpace="pre-wrap"
                            >
                                {`{
  "data": [...],
  "maxPage": 1,
  "totalResults": 1,
  "currentPage": 1,
  "resultsPerPage": 100
}`}
                            </Text>
                            <Text>Example data:</Text>
                            <Text
                                bg={"pageBackground"}
                                px={3}
                                py={2}
                                borderRadius={"8px"}
                                fontFamily={"monospace"}
                                fontSize={"sm"}
                                whiteSpace="pre-wrap"
                                w={"100%"}
                            >
                                {`{
  "username": "eridian",
  "displayName": "Eridian",
  "rank": 16,
  "score": 54,
  "addresses": [
    "0x9ca44BDA52cACb3a4F7fB3ED46498a00698238e1",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  ]
}`}
                            </Text>
                        </VStack>
                    </>
                ) : (
                    <Button
                        primaryButton
                        borderRadius={"full"}
                        px={4}
                        py={2}
                        fontWeight={"bold"}
                        onClick={handleApiKeyGeneration}
                    >
                        Generate API Key
                    </Button>
                )}
            </VStack>

            {/* Generate New API Key Confirmation Modal */}
            <ApiKeyConfirmationModal
                isOpen={showGenerateModal}
                onClose={() => setShowGenerateModal(false)}
                title="Generate a new API key"
                description={`Generating a new API key will immediately revoke your current API key. Any applications or services currently using the existing key will lose access to the ${project.displayName} API. Are you sure you want to proceed?`}
                confirmButtonText="Yes - Generate a new API key"
                cancelButtonText="No - Take me back"
                onConfirm={handleGenerateNewApiKey}
                isGenerating={true}
            />

            {/* Revoke API Key Confirmation Modal */}
            <ApiKeyConfirmationModal
                isOpen={showRevokeModal}
                onClose={() => setShowRevokeModal(false)}
                title="Revoke API key"
                description={`This action will permanently revoke your current API key. Any applications or services currently using this key will lose access to the ${project.displayName} API. This action cannot be undone. Are you sure you want to proceed?`}
                confirmButtonText="Yes - Revoke the API key"
                cancelButtonText="No - Take me back"
                onConfirm={handleRevokeApiKey}
                isGenerating={false}
            />
        </SettingsSectionContainer>
    )
}
