import { HStack, Text } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"
import { useRouter } from "next/navigation"

export default function Title() {
    const router = useRouter()

    return (
        <HStack justifyContent={"space-between"} w={"100%"} position="relative">
            <HStack
                gap={2}
                bg={"gray.800"}
                borderRadius="full"
                px={3}
                py={2}
                cursor="pointer"
                _hover={{ bg: { base: "gray.600", md: "gray.700" } }}
                onClick={() => router.back()}
                alignItems={"center"}
                position="absolute"
                left={0}
                fontSize="xl"
            >
                <FontAwesomeIcon icon={faArrowLeft} />
            </HStack>
            <Text
                fontSize={{ base: "3xl", md: "4xl" }}
                pl="50px"
                pr={{ base: "0px", md: "50px" }}
                w="100%"
                textAlign="center"
                fontWeight={"bold"}
            >
                💧 Lido Signal
            </Text>
        </HStack>
    )
}
