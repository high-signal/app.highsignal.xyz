"use client"

import { VStack, Text, HStack, Image } from "@chakra-ui/react"

export default function AcmeIncPlaceholder({ projectData }: { projectData: ProjectData }) {
    return (
        <VStack pt={5}>
            <HStack maxW="600px" justifyContent="center">
                <HStack w="fit-content" justifyContent="center" gap={3} mt={{ base: 5, xl: 0 }}>
                    <Image
                        src={projectData.projectLogoUrl}
                        alt={projectData.displayName}
                        boxSize="50px"
                        borderRadius="full"
                    />
                    <Text
                        fontSize={{
                            base: projectData.displayName.length >= 16 ? "2xl" : "3xl",
                            sm: "5xl",
                        }}
                        textAlign="center"
                        fontWeight="bold"
                        whiteSpace="normal"
                        overflowWrap="break-word"
                        wordBreak="break-word"
                    >
                        {projectData.displayName}
                    </Text>
                </HStack>
            </HStack>
            <VStack
                bg={"contentBackground"}
                p={4}
                borderRadius="16px"
                w="fit-content"
                border="5px solid"
                borderColor="contentBorder"
                textAlign="center"
                gap={4}
                mx={5}
                mt={5}
            >
                <Text>Acme Inc. is a fictional company High Signal uses to demo new features.</Text>
                <HStack fontSize="3xl" gap={3} justifyContent="space-around" w={"100%"}>
                    <Text>🚧</Text>
                    <Text>🏗️</Text>
                    <Text>🚧</Text>
                    <Text>🏗️</Text>
                    <Text>🚧</Text>
                </HStack>

                <Text>There&apos;s nothing to see here right now, but check again soon!</Text>
            </VStack>
        </VStack>
    )
}
