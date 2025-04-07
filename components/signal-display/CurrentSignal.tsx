import { VStack, HStack, Text, Box, Span } from "@chakra-ui/react"

interface CurrentSignalProps {
    signal: string
    signalValue: number
}

export default function CurrentSignal({ signal, signalValue }: CurrentSignalProps) {
    return (
        <VStack w="100%" maxW="600px" gap={3}>
            <HStack
                justifyContent={"center"}
                alignItems={"center"}
                gap={5}
                fontSize={{ base: "40px", sm: "50px" }}
                fontWeight="bold"
                pb={2}
                w={"100%"}
            >
                <Text textAlign={"center"}>
                    <Span color={`scoreColor.${signal}`}>{signal.charAt(0).toUpperCase() + signal.slice(1)}</Span>{" "}
                    Signal
                </Text>
                <Text px={4} py={0} border={"5px solid"} borderRadius="25px" borderColor={`scoreColor.${signal}`}>
                    {signalValue}
                </Text>
            </HStack>
            <VStack align="stretch" gap={1} pb={8} w={"100%"}>
                <HStack gap={0} h={"30px"} w={"100%"}>
                    {["Low", "Mid", "High"].map((level, index) => (
                        <Text
                            key={level}
                            fontSize="20px"
                            w={index === 1 ? "40%" : "30%"}
                            textAlign="center"
                            fontWeight={signal === level ? "bold" : "normal"}
                            color={signal === level ? `scoreColor.${signal}` : "inherit"}
                        >
                            {level}
                        </Text>
                    ))}
                </HStack>
                <HStack
                    gap={0}
                    h={"35px"}
                    w={"100%"}
                    border={"3px solid"}
                    borderRadius={"10px"}
                    borderColor={"gray.800"}
                    overflow={"hidden"}
                    position="relative"
                >
                    <Box
                        position="relative"
                        w={`${signalValue}%`}
                        h={"100%"}
                        textAlign="center"
                        borderRight={"3px solid"}
                        borderColor={`scoreColor.${signal}`}
                        _before={{
                            content: '""',
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            bg: `scoreColor.${signal}`,
                            opacity: 0.3,
                            zIndex: -1,
                        }}
                    />
                    <Box
                        position="absolute"
                        left="30%"
                        top="0"
                        bottom="0"
                        borderLeft="2px dashed"
                        borderColor="gray.800"
                    />
                    <Box
                        position="absolute"
                        left="70%"
                        top="0"
                        bottom="0"
                        borderLeft="2px dashed"
                        borderColor="gray.800"
                    />
                </HStack>
            </VStack>
        </VStack>
    )
}
