import { HStack, Text } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"
import { useRouter } from "next/navigation"

export default function Title() {
    const router = useRouter()

    return (
        <HStack position="relative" justifyContent="space-between" w="100%" pb={3}>
            <HStack
                position="absolute"
                left={0}
                gap={2}
                px={3}
                py={2}
                w="auto"
                bg="gray.800"
                borderRadius="full"
                cursor="pointer"
                _hover={{ bg: { base: "gray.600", md: "gray.700" } }}
                onClick={() => router.back()}
                alignItems="center"
                fontSize="xl"
            >
                <FontAwesomeIcon icon={faArrowLeft} />
            </HStack>
            <Text
                w="100%"
                pr={{ base: "0px", md: "50px" }}
                fontSize={{ base: "3xl", md: "4xl" }}
                textAlign="center"
                fontWeight="bold"
            >
                💧 Lido Signal
            </Text>
        </HStack>
    )
}
