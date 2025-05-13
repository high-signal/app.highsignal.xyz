import { HStack, Text, Image, Button } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"
import { useRouter } from "next/navigation"

export default function Title({ projectData }: { projectData: ProjectData }) {
    const router = useRouter()

    return (
        <HStack position="relative" justifyContent="space-between" w="100%" maxW="600px" pb={3}>
            <Button
                secondaryButton
                position="absolute"
                left={0}
                gap={2}
                px={3}
                py={2}
                w="auto"
                borderRadius="full"
                onClick={() => {
                    router.push(`/p/${projectData.urlSlug}${window.location.search}`)
                }}
                alignItems="center"
                fontSize="xl"
            >
                <FontAwesomeIcon icon={faArrowLeft} />
            </Button>
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
