import { VStack, Text, Button, HStack } from "@chakra-ui/react"
import { useState } from "react"

import { usePrivy } from "@privy-io/react-auth"
import SingleLineTextInput from "../ui/SingleLineTextInput"
import { toaster } from "../ui/toaster"

const DeleteAccountContainer = ({ targetUser }: { targetUser: UserData }) => {
    const { getAccessToken } = usePrivy()

    const [firstCheck, setFirstCheck] = useState(false)
    const [isInputValid, setIsInputValid] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const [inputValue, setInputValue] = useState("")

    const handleDeleteAccount = async () => {
        // Confirm that the user has read the warning and wants to delete their account
        if (!firstCheck || !isInputValid) {
            return
        }

        setIsDeleting(true)
        const token = await getAccessToken()
        const response = await fetch(`/api/settings/u/accounts/privy-accounts?username=${targetUser.username}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error(errorData.error)

            // If there was an error deleting the account, stop the loading state
            // and show an error message
            setIsDeleting(false)
            toaster.create({
                title: "❌ Error deleting account",
                description: errorData.error,
                type: "error",
            })
        } else {
            // If the response is successful, redirect to the home page
            window.location.href = "/"
        }
    }

    return (
        <VStack
            mt={10}
            gap={4}
            border={"5px solid"}
            borderColor={"red.500"}
            px={2}
            pt={2}
            pb={4}
            borderRadius={"16px"}
            w={"100%"}
        >
            <Text fontSize={"2xl"} fontWeight={"bold"}>
                Danger Zone
            </Text>
            <VStack gap={2} textAlign={"center"}>
                <Text>This will delete your High Signal account and all your data.</Text>
                <Text fontWeight={"bold"}>This action is irreversible.</Text>
            </VStack>
            {!firstCheck && (
                <Button
                    dangerButton
                    onClick={async () => {
                        setFirstCheck(true)
                    }}
                    px={3}
                    py={2}
                    borderRadius={"full"}
                >
                    <HStack gap={3}>
                        <Text>⚠️</Text>
                        <Text>Delete your High Signal account</Text>
                        <Text>⚠️</Text>
                    </HStack>
                </Button>
            )}
            {firstCheck && (
                <VStack gap={2} textAlign={"center"}>
                    <Text fontStyle={"italic"} px={3} py={1} borderRadius={"full"} bg={"contentBackground"}>
                        Are you sure?
                    </Text>
                    <Text>Type "delete" to confirm</Text>
                    <SingleLineTextInput
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value)
                            if (e.target.value === "delete") {
                                setIsInputValid(true)
                            } else {
                                setIsInputValid(false)
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleDeleteAccount()
                            }
                        }}
                    />
                    <Button
                        dangerButton
                        onClick={async () => {
                            handleDeleteAccount()
                        }}
                        disabled={!isInputValid}
                        loading={isDeleting}
                        px={3}
                        py={2}
                        borderRadius={"full"}
                    >
                        <HStack gap={3}>
                            <Text>⚠️</Text>
                            <Text>Yes - Delete my account</Text>
                            <Text>⚠️</Text>
                        </HStack>
                    </Button>
                    <Button
                        secondaryButton
                        onClick={() => {
                            setFirstCheck(false)
                            setInputValue("")
                            setIsInputValid(false)
                        }}
                        px={3}
                        py={2}
                        borderRadius={"full"}
                    >
                        <Text>No - Keep my account</Text>
                    </Button>
                </VStack>
            )}
        </VStack>
    )
}

export default DeleteAccountContainer
