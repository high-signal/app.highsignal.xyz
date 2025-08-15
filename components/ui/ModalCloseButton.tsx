"use client"

import { Box, Button } from "@chakra-ui/react"
import { faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

export default function ModalCloseButton({ onClose, noRadius }: { onClose: () => void; noRadius?: boolean }) {
    return (
        <Button
            closeButton
            position="absolute"
            right={0}
            top={0}
            onClick={onClose}
            borderBottomLeftRadius={"50px"}
            borderTopRightRadius={noRadius ? "0px" : { base: 0, md: "16px" }}
            borderTopLeftRadius={"0px"}
            borderBottomRightRadius={"0px"}
            color={"pageBackground"}
            w="40px"
            h="40px"
            minW="40px"
            maxW="40px"
            justifyContent={"center"}
            alignItems={"center"}
            display="flex"
        >
            <Box pl={2} pb={1}>
                <FontAwesomeIcon icon={faXmark} />
            </Box>
        </Button>
    )
}
