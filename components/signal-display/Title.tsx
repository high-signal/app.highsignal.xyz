import { HStack, Text, Image, Button } from "@chakra-ui/react"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"

export default function Title({ projectData }: { projectData: ProjectData }) {
    return (
        <HStack position="relative" justifyContent="space-between" w="100%" maxW="600px" pb={3}>
            <Link href={`/p/${projectData.urlSlug}${window.location.search}`}>
                <Button
                    secondaryButton
                    position="absolute"
                    left={0}
                    transform="translateY(-50%)"
                    gap={2}
                    px={3}
                    py={2}
                    w="auto"
                    borderRadius="full"
                    alignItems="center"
                    fontSize="xl"
                >
                    <FontAwesomeIcon icon={faArrowLeft} />
                </Button>
            </Link>
            <HStack w="100%" justifyContent="center" gap={3}>
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
    )
}
