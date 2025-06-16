import { HStack, Text, Image, Button, VStack } from "@chakra-ui/react"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"

export default function Title({ projectData }: { projectData: ProjectData }) {
    return (
        <VStack justifyContent="center" w="100%" maxW="800px" pb={3} pt={{ base: 0, sm: 6 }} gap={{ base: 5, sm: 0 }}>
            <HStack w={"100%"}>
                <Link href={`/p/${projectData.urlSlug}${window.location.search}`}>
                    <Button
                        secondaryButton
                        gap={2}
                        px={3}
                        py={2}
                        w="auto"
                        borderRadius="full"
                        alignItems="center"
                        fontSize="xl"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        <Text fontSize="md" fontWeight={"normal"}>
                            {projectData.displayName} leaderboard
                        </Text>
                    </Button>
                </Link>
            </HStack>
            <HStack>
                <HStack w="fit-content" justifyContent="center" gap={3} mt={{ base: 0, sm: "-40px" }}>
                    <Image
                        src={projectData.projectLogoUrl}
                        alt={projectData.displayName}
                        boxSize="50px"
                        borderRadius="full"
                    />
                    <Text fontSize={{ base: "3xl", sm: "4xl" }} textAlign="center" fontWeight="bold">
                        {projectData.displayName}
                    </Text>
                </HStack>
            </HStack>
        </VStack>
    )
}
